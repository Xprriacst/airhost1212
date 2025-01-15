import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';

// Regex pour valider les numéros de téléphone français (avec ou sans +)
const WHATSAPP_PHONE_REGEX = /^(\+33|33)[67]\d{8}$/;

// Fonction pour formater le numéro de téléphone
const formatPhoneNumber = (phone: string): string => {
  // Supprimer tout ce qui n'est pas un chiffre
  const cleaned = phone.replace(/\D/g, '');
  
  // Supprimer le 0 initial s'il existe
  const withoutLeadingZero = cleaned.replace(/^0/, '');
  
  // Ajouter 33 au début si nécessaire
  const withPrefix = withoutLeadingZero.startsWith('33') 
    ? withoutLeadingZero 
    : `33${withoutLeadingZero}`;
  
  return withPrefix;
};

// Schéma de validation pour les messages entrants
const messageSchema = z.object({
  propertyId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string()
    .min(1, 'Phone number is required')
    .transform(formatPhoneNumber)
    .refine(
      phone => WHATSAPP_PHONE_REGEX.test(`+${phone}`),
      'Invalid French mobile number format'
    ),
  message: z.string().min(1, 'Message cannot be empty'),
  platform: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
  timestamp: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  isHost: z.boolean().optional().default(false),
  webhookId: z.string().optional(),
  waMessageId: z.string().optional(),
  waNotifyName: z.string().optional()
});

// Cache pour stocker les messages récents (5 minutes max)
const recentMessages = new Map<string, number>();

// Cache pour stocker les webhooks traités (5 minutes max)
const processedWebhooks = new Map<string, number>();

// Nettoyer les messages plus vieux que 5 minutes
const cleanupOldMessages = () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, timestamp] of recentMessages.entries()) {
    if (timestamp < fiveMinutesAgo) {
      recentMessages.delete(key);
    }
  }
};

// Nettoyer les webhooks plus vieux que 5 minutes
const cleanupOldWebhooks = () => {
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (timestamp < fiveMinutesAgo) {
      processedWebhooks.delete(key);
    }
  }
};

export const handler: Handler = async (event) => {
  console.log('🚀 Receive Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    console.log('📦 Raw request body:', event.body);
    const body = JSON.parse(event.body || '{}');
    console.log('📦 Parsed body:', JSON.stringify(body, null, 2));

    const data = messageSchema.parse(body);
    console.log('✅ Validated data:', JSON.stringify(data, null, 2));

    // Nettoyage des caches
    cleanupOldMessages();
    cleanupOldWebhooks();

    // Vérification du webhook ID pour éviter les doublons
    if (data.webhookId && processedWebhooks.has(data.webhookId)) {
      console.log('🔄 Duplicate webhook detected, skipping...');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          skipped: true,
          reason: 'duplicate_webhook'
        }),
      };
    }

    if (data.webhookId) {
      processedWebhooks.set(data.webhookId, Date.now());
    }
    
    const propertyId = data.propertyId || process.env.DEFAULT_PROPERTY_ID;
    if (!propertyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Property ID is required' }) };
    }

    // Recherche de la propriété
    const properties = await propertyService.getProperties();
    const property = properties.find((p) => p.id === propertyId);
    if (!property) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Property not found' }) };
    }

    // Récupération des conversations
    const conversations = await conversationService.fetchPropertyConversations(propertyId);
    let conversation = conversations.find((conv) => conv.guestPhone === data.guestPhone);

    // Création d'une nouvelle conversation si nécessaire
    if (!conversation) {
      conversation = await conversationService.addConversation({
        Properties: [propertyId],
        'Guest Name': data.waNotifyName || data.guestName || 'Guest',
        'Guest Email': data.guestEmail || '',
        'Guest phone number': data.guestPhone,
        'Check-in Date': data.checkInDate,
        'Check-out Date': data.checkOutDate,
        Messages: JSON.stringify([{
          id: Date.now().toString(),
          text: data.message,
          timestamp: new Date(),
          sender: data.isHost ? 'host' : 'guest',
          type: 'text',
          metadata: {
            platform: data.platform,
            ...(data.waMessageId && { waMessageId: data.waMessageId }),
            ...(data.waNotifyName && { waNotifyName: data.waNotifyName })
          }
        }]),
        'Auto Pilot': false
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          conversationId: conversation.id,
          messageId: conversation.messages[0].id
        }),
      };
    }

    // Ajout du message à une conversation existante
    if (!data.isHost) {
      const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: data.message,
        timestamp: new Date(data.timestamp || Date.now()),
        sender: 'guest',
        type: 'text',
        metadata: {
          platform: data.platform,
          ...(data.waMessageId && { waMessageId: data.waMessageId }),
          ...(data.waNotifyName && { waNotifyName: data.waNotifyName })
        }
      };

      const updatedMessages = [...(conversation.messages || []), newMessage];
      await conversationService.updateConversation(conversation.id, {
        Messages: JSON.stringify(updatedMessages),
      });

      // Incrémenter le compteur et envoyer la notification
      await conversationService.incrementUnreadCount(conversation.id);

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          conversationId: conversation.id,
          messageId: newMessage.id
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        conversationId: conversation.id,
        skipped: true
      }),
    };

  } catch (error) {
    console.error('🚨 Error processing message:', error);
    
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: error.errors
        }),
      };
    }

    if (error.error) {
      console.error('🚨 Airtable error details:', {
        type: error.error.type,
        message: error.error.message,
        statusCode: error.statusCode
      });
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error.error || error
      }),
    };
  }
};
