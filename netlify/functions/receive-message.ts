import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';
import { aiService } from '../../src/services/ai/aiService';
import { EmergencyDetectionService } from '../../src/services/emergencyDetectionService';

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
  webhookId: z.string().optional()
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
const sendNotification = async (title: string, body: string, messageId: string) => {
  try {
    console.log('📱 Sending notification:', { title, body, messageId });
    
    const response = await fetch('https://airhost1212-production.up.railway.app/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        title, 
        body,
        messageId,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Notification sent:', data);
  } catch (error) {
    console.error('❌ Failed to send notification:', error);
  }
};

// Récupérer les cas d'urgence (hardcodés pour l'instant)
const getEmergencyCases = async () => {
  return [
    {
      id: '1',
      name: 'Urgences',
      description: 'Quand un voyageur vous envoie un message concernant une urgence',
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
    },
    {
      id: '2',
      name: 'Voyageur mécontent',
      description: 'Quand un voyageur exprime son mécontentement',
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
    },
    {
      id: '3',
      name: "Impossible d'accéder au logement",
      description: 'Quand les voyageurs ne peuvent pas accéder au logement',
      severity: 'high',
      autoDisablePilot: true,
      notifyHost: true,
    },
    {
      id: '4',
      name: 'Appareil en panne',
      description: "Quand un voyageur signale qu'un appareil ne fonctionne pas",
      severity: 'medium',
      autoDisablePilot: true,
      notifyHost: true,
    },
    {
      id: '5',
      name: 'Problème de stock',
      description: 'Quand un voyageur signale un manque de produits essentiels',
      severity: 'medium',
      autoDisablePilot: true,
      notifyHost: true,
    }
  ];
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
        'Guest Name': data.guestName || 'Guest',
        'Guest Email': data.guestEmail || '',
        'Guest phone number': data.guestPhone,
        'Check-in Date': data.checkInDate,
        'Check-out Date': data.checkOutDate,
        Messages: JSON.stringify([{
          id: Date.now().toString(),
          text: data.message,
          timestamp: new Date(),
          sender: data.isHost ? 'host' : 'guest',
          type: 'text'
        }]),
        'Auto-Pilot': false // Correction du nom du champ Auto Pilot
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

    // Détecter si c'est un cas d'urgence
    const emergencyCases = await getEmergencyCases();
    const emergencyDetectionService = new EmergencyDetectionService(emergencyCases);
    const detectedEmergency = await emergencyDetectionService.analyzeMessage(data.message);

    // Si c'est un cas d'urgence, désactiver l'Auto-Pilot
    if (detectedEmergency?.autoDisablePilot) {
      console.log('🚨 Emergency detected:', detectedEmergency.name);
      
      // Récupérer toutes les conversations pour ce logement
      console.log('Fetching conversations for property:', data.propertyId);
      const conversations = await conversationService.fetchPropertyConversations(propertyId);
      const conversation = conversations.find((conv) => conv.guestPhone === data.guestPhone);

      if (conversation) {
        // Désactiver l'Auto-Pilot
        await conversationService.updateConversation(conversation.id, {
          'Auto Pilot': false,
          'Last Emergency': detectedEmergency.name,
          'Emergency Detected At': new Date().toISOString()
        });
        
        console.log('✅ Auto-Pilot disabled for conversation:', conversation.id);
      }
    }

    // Ajout du message à une conversation existante
    if (!data.isHost) {
      const newMessage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: data.message,
        timestamp: new Date(data.timestamp || Date.now()),
        sender: 'guest',
        type: 'text'
      };

      const updatedMessages = [...(conversation.messages || []), newMessage];
      await conversationService.updateConversation(conversation.id, {
        Messages: JSON.stringify(updatedMessages),
      });

      // Incrémenter le compteur et envoyer la notification
      await conversationService.incrementUnreadCount(conversation.id);
      console.log('Sending notification:', {
        title: 'Nouveau message',
        body: data.message
      });
      await sendNotification('Nouveau message', data.message, newMessage.id);
      console.log('✅ Notification sent');

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
