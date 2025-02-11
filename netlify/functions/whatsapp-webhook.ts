import { Handler } from '@netlify/functions';
import Airtable from 'airtable';
import crypto from 'crypto';
import { OfficialWhatsAppService } from '../../src/services/whatsapp/officialService';

// Vérification des variables d'environnement requises
const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ Variables d\'environnement manquantes:', {
    hasApiKey: Boolean(AIRTABLE_API_KEY),
    hasBaseId: Boolean(AIRTABLE_BASE_ID)
  });
  throw new Error('Configuration Airtable incomplète');
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: {
            name: string;
          };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

const verifyWebhookSignature = (
  signature: string | undefined,
  body: string,
  appSecret: string
): boolean => {
  if (!signature) return false;

  const elements = signature.split('=');
  const signatureHash = elements[1];
  
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(body)
    .digest('hex');

  return signatureHash === expectedHash;
};

export const handler: Handler = async (event, context) => {
  console.log('🔍 Début du traitement du webhook');

  try {
    // Gestion de la validation du webhook (GET)
    if (event.httpMethod === 'GET') {
      const mode = event.queryStringParameters?.['hub.mode'];
      const token = event.queryStringParameters?.['hub.verify_token'];
      const challenge = event.queryStringParameters?.['hub.challenge'];

      if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
        return { statusCode: 200, body: challenge || '' };
      }
      return { statusCode: 403, body: 'Token de vérification invalide' };
    }

    // Gestion des requêtes POST (réception de webhook)
    if (event.httpMethod === 'POST') {
      console.log('🔍 Headers reçus:', event.headers);
      console.log('📦 Body reçu:', event.body);
      const signature = event.headers['x-hub-signature-256'];
      console.log('🔑 Signature:', signature);

      const payload = JSON.parse(event.body || '{}') as WhatsAppWebhookPayload;
      console.log('✅ Payload parsé:', payload);

      // Traitement des entrées du webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              console.log('📱 Traitement du message:', message);
              const filterFormula = `"{Guest phone number}" = '+${message.from}'`;
              console.log('🔍 Recherche avec filtre:', filterFormula);

              const records = await base('Conversations')
                .select({ filterByFormula: filterFormula })
                .firstPage();
              console.log('📚 Conversations trouvées:', records.length);

              if (records.length > 0) {
                const conversation = records[0];
                const messages = JSON.parse(conversation.get('Messages') || '[]');
                messages.push({
                  id: message.id,
                  type: message.type,
                  content: message.text?.body || '',
                  timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  direction: 'received',
                  status: 'delivered',
                  waMessageId: message.id
                });
                await base('Conversations').update(conversation.id, {
                  Messages: JSON.stringify(messages),
                  LastMessageTimestamp: new Date().toISOString()
                });
                console.log('✅ Message enregistré dans Airtable');
              } else {
                console.log(`ℹ️ Création d'une nouvelle conversation pour le numéro ${message.from}`);
                const newConversation = await base('Conversations').create({
                  'Guest phone number': message.from,
                  'Messages': JSON.stringify([{
                    id: message.id,
                    type: message.type,
                    content: message.text?.body || '',
                    timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                    direction: 'received',
                    status: 'delivered',
                    waMessageId: message.id
                  }]),
                  'Last message timestamp': new Date().toISOString()
                });
                console.log('✅ Nouvelle conversation créée:', newConversation.getId());
              }
            }
          }
        }
      }
      return { statusCode: 200, body: JSON.stringify({ status: 'success' }) };
    }
    
    return { statusCode: 405, body: JSON.stringify({ error: 'Méthode non autorisée' }) };
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement du webhook:', error);
    console.error('Stack trace:', error.stack);
    if (error.message.includes('Configuration Airtable incomplète')) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Configuration du serveur incomplète',
          details: 'Variables d\'environnement Airtable manquantes'
        })
      };
    }
    if (error instanceof SyntaxError) {
      console.error('Erreur de parsing JSON:', event.body);
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Payload invalide',
          details: error.message
        })
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Erreur interne du serveur',
        type: error.name,
        details: error.message
      })
    };
  }
};
