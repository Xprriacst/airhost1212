import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';
import axios from 'axios';

// French mobile phone number validation regex
const WHATSAPP_PHONE_REGEX = /^(\+33|33)[67]\d{8}$/;

// Phone number formatting helper
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const withoutLeadingZero = cleaned.replace(/^0/, '');
  const normalized = withoutLeadingZero.replace(/^33/, '');
  return `+33${normalized}`;
};

// Message validation schema
const messageSchema = z.object({
  propertyId: z.string().optional(),
  guestName: z.string().optional(),
  guestEmail: z.string().optional(),
  guestPhone: z.string()
    .min(1, 'Phone number is required')
    .transform(formatPhoneNumber)
    .refine(
      phone => WHATSAPP_PHONE_REGEX.test(phone),
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

// Deduplication caches
const recentMessages = new Map<string, number>();
const processedWebhooks = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Cache cleanup functions
const cleanupOldMessages = () => {
  const cutoff = Date.now() - CACHE_TTL;
  for (const [key, timestamp] of recentMessages.entries()) {
    if (timestamp < cutoff) recentMessages.delete(key);
  }
};

const cleanupOldWebhooks = () => {
  const cutoff = Date.now() - CACHE_TTL;
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (timestamp < cutoff) processedWebhooks.delete(key);
  }
};

// Send notification helper
const sendNotification = async (title: string, body: string) => {
  try {
    console.log('Sending notification:', { title, body });
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-notification`, {
      title,
      body,
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

export const handler: Handler = async (event) => {
  console.log('🚀 Receive Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    console.log('📦 Raw request body:', event.body);
    const body = JSON.parse(event.body || '{}');
    console.log('📦 Parsed body:', JSON.stringify(body, null, 2));

    const data = messageSchema.parse(body);
    console.log('✅ Validated data:', JSON.stringify(data, null, 2));

    // Clean caches
    cleanupOldMessages();
    cleanupOldWebhooks();

    // Deduplication check
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
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: 'Property ID is required' }) 
      };
    }

    // Get property
    const properties = await propertyService.getProperties();
    const property = properties.find((p) => p.id === propertyId);
    if (!property) {
      return { 
        statusCode: 404, 
        body: JSON.stringify({ error: 'Property not found' }) 
      };
    }

    // Get conversations
    const conversations = await conversationService.fetchPropertyConversations(propertyId);
    let conversation = conversations.find((conv) => conv.guestPhone === data.guestPhone);

    // Create new conversation if needed
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
      
      // Send notification for new conversation
      try {
        await sendNotification(
          'Nouvelle conversation',
          `${conversation.guestName}: ${data.message}`
        );
      } catch (error) {
        console.error('Failed to send new conversation notification:', error);
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          conversationId: conversation.id,
          messageId: conversation.messages[0].id
        }),
      };
    }

    // Add message to existing conversation
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

      // Increment unread count
      await conversationService.incrementUnreadCount(conversation.id);

      // Send notification for new message
      try {
        await sendNotification(
          'Nouveau message',
          `${conversation.guestName}: ${data.message}`
        );
      } catch (error) {
        console.error('Failed to send new message notification:', error);
      }

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

    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};

