import { Handler } from '@netlify/functions';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { conversationId, propertyId } = JSON.parse(event.body || '{}');

    if (!conversationId || !propertyId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing conversationId or propertyId' }),
      };
    }

    // Récupérer les informations du logement
    const property = await propertyService.getPropertyById(propertyId);
    if (!property) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }

    // Récupérer l'historique de la conversation
    const conversation = await conversationService.getConversationById(conversationId);
    if (!conversation) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Conversation not found' }),
      };
    }

    // Préparer le contexte pour l'IA
    const propertyContext = `
      Logement: ${property.name}
      Description: ${property.description || ''}
      Adresse: ${property.address || ''}
      Capacité: ${property.capacity || ''} personnes
      Check-in: ${property.checkInInstructions || ''}
      WiFi: ${property.wifiInformation || ''}
      Règles: ${property.rules || ''}
    `;

    // Récupérer les 5 derniers messages pour le contexte
    const recentMessages = conversation.messages
      .slice(-5)
      .map(msg => `${msg.sender === 'guest' ? 'Client' : 'Hôte'}: ${msg.text}`)
      .join('\n');

    // Générer la réponse avec GPT
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Tu es un assistant pour un hôte Airbnb. Tu dois répondre aux questions des clients de manière professionnelle, amicale et précise, en te basant sur les informations du logement. Voici les informations du logement:\n${propertyContext}`
        },
        {
          role: "user",
          content: `Voici les derniers messages de la conversation:\n${recentMessages}\n\nGénère une réponse appropriée en tant qu'hôte, en français.`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

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
      body: JSON.stringify({ error: 'Failed to generate response' }),
    };
  }
};

export { handler };
