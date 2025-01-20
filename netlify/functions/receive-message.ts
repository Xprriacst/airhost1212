import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/airtable/conversationService';
import axios from 'axios';

// Shorter deduplication window for better handling
const MESSAGE_DEDUP_TTL = 30000; // 30 seconds

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

// Deduplication caches with shorter TTL
const recentMessages = new Map<string, number>();
const processedWebhooks = new Map<string, number>();

// Cache cleanup functions
const cleanupOldMessages = () => {
  const cutoff = Date.now() - MESSAGE_DEDUP_TTL;
  for (const [key, timestamp] of recentMessages.entries()) {
    if (timestamp < cutoff) recentMessages.delete(key);
  }
};

const cleanupOldWebhooks = () => {
  const cutoff = Date.now() - MESSAGE_DEDUP_TTL;
  for (const [key, timestamp] of processedWebhooks.entries()) {
    if (timestamp < cutoff) processedWebhooks.delete(key);
  }
};

// Send notification helper with improved error handling
const sendNotification = async (title: string, body: string) => {
  try {
    console.log('📨 Sending notification:', { title, body });
    
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/send-notification`,
      { title, body },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000 // 5 second timeout
      }
    );

    console.log('✅ Notification sent:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
    }
    throw error;
  }
};

export const handler: Handler = async (event) => {
  console.log('🚀 Receive Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));

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

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
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

    // Enhanced deduplication check using both webhookId and waMessageId
    const dedupKey = data.webhookId || data.waMessageId;
    if (dedupKey) {
      const existingTimestamp = processedWebhooks.get(dedupKey);
      
      if (existingTimestamp) {
        const timeSinceLastProcess = Date.now() - existingTimestamp;
        
        if (timeSinceLastProcess < MESSAGE_DEDUP_TTL) {
          console.log('🔄 Duplicate message detected:', {
            key: dedupKey,
            timeSinceLastProcess: `${timeSinceLastProcess}ms`
          });
          
          return {
            statusCode: 200,
            body: JSON.stringify({ 
              status: 'success',
              skipped: true,
              reason: 'duplicate_message',
              details: {
                key: dedupKey,
                age: timeSinceLastProcess
              }
            }),
          };
        }
      }
      
      processedWebhooks.set(dedupKey, Date.now());
    }
    
    const propertyId = data.propertyId || process.env.DEFAULT_PROPERTY_ID;
    if (!propertyId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Property ID is required' }) };
    }

    // Get property without authentication check
    const properties = await propertyService.getAllPropertiesWithoutFiltering();
    const property = properties.find((p) => p.id === propertyId);
    if (!property) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Property not found' }) };
    }

    // Get all conversations and find one with matching phone number
    console.log('🔍 Fetching all conversations...');
    const conversations = await conversationService.getAllConversationsWithoutAuth();
    console.log(`✅ Found ${conversations.length} conversations`);
    console.log('🔍 Looking for conversation with phone:', data.guestPhone);
    let conversation = conversations.find(conv => {
      console.log('Checking conversation:', {
        id: conv.id,
        phone: conv['Guest phone number'],
        match: conv['Guest phone number'] === data.guestPhone
      });
      return conv['Guest phone number'] === data.guestPhone;
    });
    console.log('🔍 Conversation found:', conversation ? 'yes' : 'no');

    if (conversation) {
      // Update existing conversation
      const currentMessages = conversation.Messages ? JSON.parse(conversation.Messages) : [];
      const updatedMessages = [...currentMessages, {
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
      }];

      conversation = await conversationService.updateConversationWithoutAuth(conversation.id, {
        Messages: JSON.stringify(updatedMessages)
      });
    } else {
      // Create new conversation
      conversation = await conversationService.addConversationWithoutAuth({
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
    }
    
    // Send notification
    try {
      await sendNotification(
        'Nouveau message',
        `${conversation['Guest Name'] || 'Guest'}: ${data.message}`
      );
    } catch (error) {
      console.error('Failed to send notification:', error);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        conversation: {
          id: conversation.id,
          propertyId: propertyId,
          guestName: conversation['Guest Name'],
          guestPhone: conversation['Guest phone number'],
          isNewConversation: !conversation
        }
      })
    };

  } catch (error) {
    console.error('❌ Error processing message:', error);
    return {
      statusCode: error instanceof z.ZodError ? 400 : 500,
      body: JSON.stringify({ 
        error: error instanceof z.ZodError ? 'Validation error' : 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
