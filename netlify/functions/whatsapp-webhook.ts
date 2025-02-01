import { Handler } from '@netlify/functions';
import { whatsappBusinessAccountService } from '../../src/services/whatsapp/businessAccountService';
import { whatsappConfig } from '../../src/config/whatsapp';
import crypto from 'crypto';

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

      // Vérifier que le token correspond à celui configuré
      if (mode === 'subscribe' && token === whatsappConfig.verifyToken) {
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
      const signature = event.headers['x-hub-signature-256'];
      const payload = JSON.parse(event.body || '{}') as WhatsAppWebhookPayload;

      // Vérifier la signature du webhook
      if (!verifyWebhookSignature(signature, event.body || '', process.env.WHATSAPP_APP_SECRET || '')) {
        return {
          statusCode: 401,
          body: JSON.stringify({ error: 'Signature invalide' }),
        };
      }

      // Traiter chaque entrée du webhook
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const value = change.value;

          // Récupérer le compte WhatsApp associé au numéro
          const phoneNumber = value.metadata.display_phone_number;
          const account = await whatsappBusinessAccountService.getAccountByPhoneNumber(phoneNumber);

          if (!account) {
            console.error(`Aucun compte trouvé pour le numéro ${phoneNumber}`);
            continue;
          }

          // Traiter les messages
          if (value.messages && value.messages.length > 0) {
            for (const message of value.messages) {
              // TODO: Implémenter le traitement des messages
              console.log('Message reçu:', message);
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
