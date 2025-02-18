import { Handler } from '@netlify/functions';
import Airtable from 'airtable';
import OpenAI from 'openai';

// Configuration Airtable
const airtable = new Airtable({ apiKey: process.env.VITE_AIRTABLE_API_KEY });
const base = airtable.base(process.env.VITE_AIRTABLE_BASE_ID || '');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const handler: Handler = async (event) => {
  console.log('Generate AI response function started');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    console.log('Request body:', body);
    
    const { conversationId, propertyId, guestEmail } = body;

    if (!conversationId || !propertyId || !guestEmail) {
      console.log('Missing required fields:', { conversationId, propertyId, guestEmail });
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          requiredFields: ['conversationId', 'propertyId', 'guestEmail']
        }),
      };
    }

    // Récupérer les informations du logement
    console.log('Fetching property:', propertyId);
    const property = await new Promise((resolve, reject) => {
      base('Properties').find(propertyId, (err, record) => {
        if (err) {
          console.error('Error fetching property:', err);
          reject(err);
          return;
        }
        console.log('Raw property record:', record);
        console.log('Property fields:', record?.fields);
        resolve(record);
      });
    });

    if (!property) {
      console.log('Property not found:', propertyId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }
    console.log('Property found:', property.get('name'));

    // Récupérer la conversation
    console.log('Fetching conversation:', conversationId);
    const conversations = await new Promise((resolve, reject) => {
      base('Conversations')
        .select({
          filterByFormula: `AND({PropertyId} = '${propertyId}', {GuestEmail} = '${guestEmail}', RECORD_ID() = '${conversationId}')`
        })
        .firstPage((err, records) => {
          if (err) {
            console.error('Error fetching conversation:', err);
            reject(err);
            return;
          }
          resolve(records);
        });
    });

    if (!conversations || conversations.length === 0) {
      console.log('Conversation not found:', conversationId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    const conversation = conversations[0];

    // Récupérer les messages
    const rawMessages = conversation.get('Messages'); 
    console.log('Raw messages from Airtable:', rawMessages);
    
    let messages = [];
    try {
      messages = rawMessages ? JSON.parse(rawMessages) : [];
    } catch (error) {
      console.error('Error parsing messages:', error);
      messages = [];
    }
    
    console.log('Parsed messages:', messages);
    console.log('Conversation found with', messages.length, 'messages');

    // Récupérer les 5 derniers messages pour le contexte
    const recentMessages = messages
      .slice(-5)
      .map(msg => `${msg.sender === 'guest' ? 'Client' : 'Hôte'}: ${msg.text}`)
      .join('\n');
    
    console.log('Recent messages for AI:', recentMessages);

    // Préparer le contexte pour l'IA
    const propertyContext = `
      Logement: ${property.get('name')}
      Description: ${property.get('description') || ''}
      Adresse: ${property.get('address') || ''}
      Capacité: ${property.get('capacity') || ''} personnes
      Check-in: ${property.get('checkInInstructions') || ''}
      WiFi: ${property.get('wifiInformation') || ''}
      Règles: ${property.get('rules') || ''}
    `;

    // Récupérer et parser les instructions AI
    let aiInstructions = '';
    try {
      const rawInstructions = property.get('AI Instructions');
      console.log('Raw AI Instructions:', rawInstructions);
      
      if (rawInstructions) {
        const instructions = JSON.parse(rawInstructions);
        console.log('Parsed AI Instructions:', instructions);
        
        // Trier par priorité et ne prendre que les instructions actives
        const activeInstructions = instructions
          .filter((inst: any) => inst.isActive)
          .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0));
        
        console.log('Active AI Instructions:', activeInstructions);
        
        // Extraire le contenu
        aiInstructions = activeInstructions
          .map((inst: any) => inst.content)
          .join('\n\n');
      }
    } catch (error) {
      console.error('Error parsing AI Instructions:', error);
    }

    console.log('Final AI Instructions:', aiInstructions);

    console.log('Calling OpenAI API...');
    // Générer la réponse avec GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",  // Version mini optimisée pour les tâches spécifiques
      messages: [
        {
          role: "system",
          content: `Tu es un assistant pour un hôte Airbnb. Tu dois répondre aux questions des clients de manière professionnelle, amicale et précise.

Voici les informations du logement:
${propertyContext}

Instructions spécifiques et connaissances supplémentaires:
${aiInstructions}

Utilise ces informations pour répondre aux questions des clients. Si une question correspond à une des instructions spécifiques, utilise cette réponse en priorité. Sinon, base-toi sur les informations générales du logement.`
        },
        {
          role: "user",
          content: `Voici les derniers messages de la conversation:\n${recentMessages}\n\nGénère une réponse appropriée en tant qu'hôte, en français.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    console.log('OpenAI response received');

    return {
      statusCode: 200,
      body: JSON.stringify({
        response: completion.choices[0].message.content
      }),
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate response',
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  }
};

export { handler };
