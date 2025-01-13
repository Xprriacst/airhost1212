import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';
import { aiService } from '../../src/services/ai/aiService';

// Schéma de validation pour les messages entrants
const messageSchema = z.object({
  propertyId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message cannot be empty'),
  platform: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
  timestamp: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
  isHost: z.boolean().optional().default(false),
  webhookId: z.string().optional() // ID unique du webhook Make
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

// Fonction pour envoyer une notification
const sendNotification = async (title: string, body: string) => {
  try {
    console.log('📱 Sending notification:', { title, body });
    
    // Utiliser l'URL complète du serveur Railway
    const response = await fetch('https://airhost1212-production.up.railway.app/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, body })
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Notification sent:', data);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
    // Ne pas relancer l'erreur pour éviter d'interrompre le traitement du message
  }
};

export const handler: Handler = async (event) => {
  console.log('🚀 Receive Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));

  // Vérifier la configuration Airtable
  try {
    const { env, isConfigValid } = await import('../../src/config/env');
    console.log('🔑 Airtable Config:', {
      isValid: isConfigValid,
      hasApiKey: Boolean(env.airtable.apiKey),
      hasBaseId: Boolean(env.airtable.baseId)
    });
  } catch (configError) {
    console.error('❌ Error checking config:', configError);
  }

  if (event.httpMethod !== 'POST') {
    console.warn('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('📦 Raw request body:', event.body);
    const body = JSON.parse(event.body || '{}');
    console.log('📦 Parsed body:', JSON.stringify(body, null, 2));

    try {
      const data = messageSchema.parse(body);
      console.log('✅ Validated data:', JSON.stringify(data, null, 2));
    } catch (validationError) {
      console.error('❌ Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            error: 'Validation failed',
            details: validationError.errors
          })
        };
      }
      throw validationError;
    }

    const data = messageSchema.parse(body);

    // Si propertyId n'est pas fourni, on utilise une valeur par défaut
    const propertyId = data.propertyId || process.env.DEFAULT_PROPERTY_ID;
    console.log('🏠 Using property ID:', propertyId);
    
    if (!propertyId) {
      console.error('❌ No propertyId provided and no default set');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Property ID is required' }),
      };
    }

    // Recherche de la propriété
    console.log('🔍 Searching for property:', propertyId);
    const properties = await propertyService.getProperties();
    console.log('📋 Found properties:', properties.length);
    
    const property = properties.find((p) => p.id === propertyId);

    if (!property) {
      console.error('❌ Property not found for ID:', propertyId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }

    console.log('✅ Found property:', {
      id: property.id,
      name: property.name
    });

    // Récupération des conversations pour cette propriété
    console.log('📝 Fetching conversations for property:', propertyId);
    const conversations = await conversationService.fetchPropertyConversations(propertyId);
    console.log('📝 Found conversations:', conversations.length);

    // Vérification si une conversation existe pour ce numéro de téléphone
    let conversation = conversations.find(
      (conv) => conv.guestPhone === data.guestPhone
    );

    if (conversation) {
      console.log('📝 Found existing conversation:', conversation.id);
    } else {
      console.log('🔄 Creating new conversation');
      try {
        conversation = await conversationService.addConversation({
          Properties: [propertyId],
          'Guest Name': data.guestName || 'Guest',
          'Guest Email': data.guestEmail || '',
          'Guest phone number': data.guestPhone,
          Messages: JSON.stringify([{
            id: Date.now().toString(),
            text: data.message,
            timestamp: new Date(),
            sender: data.isHost ? 'host' : 'guest',
            type: 'text'
          }]),
          'Auto Pilot': false
        });
        console.log('✅ New conversation created:', conversation.id);
        
        // Si on vient de créer la conversation avec le message, pas besoin de l'ajouter à nouveau
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            status: 'success',
            conversationId: conversation.id,
            messageId: conversation.messages[0].id
          }),
        };
      } catch (error) {
        console.error('❌ Failed to create conversation:', error);
        throw error;
      }
    }

    // On ajoute le message seulement si la conversation existait déjà
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: data.message,
      timestamp: new Date(data.timestamp || Date.now()),
      sender: data.isHost ? 'host' : 'guest',
      type: 'text'
    };

    console.log('📨 Adding new message to conversation:', {
      conversationId: conversation.id,
      message: newMessage
    });

    // Si le message vient de nous (via Make), on ne l'ajoute pas
    if (data.isHost) {
      console.log('⚠️ Host message received via webhook, skipping...');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          conversationId: conversation.id,
          skipped: true
        }),
      };
    }

    const updatedMessages = [...(conversation.messages || []), newMessage];
    await conversationService.updateConversation(conversation.id, {
      Messages: JSON.stringify(updatedMessages),
    });

    // Incrémenter le compteur de messages non lus si le message vient du guest
    if (!data.isHost) {
      await conversationService.incrementUnreadCount(conversation.id);

      // Envoyer la notification seulement si ce n'est pas un message WhatsApp
      if (!data.platform || data.platform !== 'whatsapp') {
        await sendNotification('Nouveau message', data.message);
      }
    }

    console.log('📨 Message added to conversation');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        conversationId: conversation.id,
        messageId: newMessage.id
      }),
    };
  } catch (error) {
    console.error('🚨 Error processing message:', {
      error: error,
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    if (error instanceof z.ZodError) {
      console.error('🚨 Validation errors:', error.errors);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Invalid request data',
          details: error.errors
        }),
      };
    }

    // Log any Airtable specific error details
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
