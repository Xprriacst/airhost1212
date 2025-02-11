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
  try {
    // 1. Vérification du mode hub.challenge pour la validation du webhook
    if (event.httpMethod === 'GET') {
      const mode = event.queryStringParameters?.['hub.mode'];
      const token = event.queryStringParameters?.['hub.verify_token'];
      const challenge = event.queryStringParameters?.['hub.challenge'];

      // Récupérer la configuration WhatsApp depuis Airtable
      const records = await base('Users').select({
        filterByFormula: "NOT({whatsapp_business_config} = '')"  // Sélectionne les utilisateurs avec une config WhatsApp
      }).firstPage();

      let verifyToken = '';
      for (const record of records) {
        const configStr = record.get('whatsapp_business_config') as string;
        if (configStr) {
          try {
            const config = JSON.parse(configStr);
            if (config.verify_token) {
              verifyToken = config.verify_token;
              break;
            }
          } catch (error) {
            console.error('Erreur lors du parsing de la config WhatsApp:', error);
          }
        }
      }

      // Vérifier que le token correspond à celui configuré
      if (mode === 'subscribe' && token === verifyToken) {
        return {
          statusCode: 200,
          body: challenge || '',
        };
      }

      return {
        statusCode: 403,
        body: 'Token de vérification invalide',
      };
    }

    // 2. Traitement des webhooks entrants
    if (event.httpMethod === 'POST') {
      console.log('🔍 Headers reçus:', event.headers);
      console.log('📦 Body reçu:', event.body);

      const signature = event.headers['x-hub-signature-256'];
      console.log('🔑 Signature:', signature);

      try {
        const payload = JSON.parse(event.body || '{}') as WhatsAppWebhookPayload;
        console.log('✅ Payload parsé:', payload);

      // TODO: Réactiver la vérification de signature une fois WHATSAPP_APP_SECRET configuré
      // if (!verifyWebhookSignature(signature, event.body || '', process.env.WHATSAPP_APP_SECRET || '')) {
      //   return {
      //     statusCode: 401,
      //     body: JSON.stringify({ error: 'Signature invalide' }),
      //   };
      // }

      // Traiter chaque entrée du webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Traiter les messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              console.log('Message reçu:', message);
              
              console.log('📱 Traitement du message:', message);

              // Rechercher la conversation correspondante dans Airtable
              const filterFormula = `{guest_phone} = '${message.from}'`;
              console.log('🔍 Recherche avec filtre:', filterFormula);

              const records = await base('Conversations')
                .select({
                  filterByFormula: filterFormula
                })
                .firstPage();

              console.log('📚 Conversations trouvées:', records.length);

              if (records.length > 0) {
                const conversation = records[0];
                const messages = JSON.parse(conversation.get('Messages') || '[]');
                
                // Ajouter le nouveau message
                messages.push({
                  id: message.id,
                  type: message.type,
                  content: message.text?.body || '',
                  timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  direction: 'received',
                  status: 'delivered',
                  waMessageId: message.id
                });

                // Mettre à jour la conversation dans Airtable
                await base('Conversations').update(conversation.id, {
                  Messages: JSON.stringify(messages),
                  LastMessageTimestamp: new Date().toISOString()
                });

                console.log('Message enregistré dans Airtable');
              } else {
                console.log(`Aucune conversation trouvée pour le numéro ${message.from}`);
              }
            }
          }

          // Traiter les statuts
          if (value.statuses && value.statuses.length > 0) {
            for (const status of value.statuses) {
              // TODO: Implémenter la mise à jour des statuts
              console.log('Mise à jour de statut:', status);
            }
          }
        }
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'success' }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Méthode non autorisée' }),
    };
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erreur interne du serveur' }),
    };
  }
};
