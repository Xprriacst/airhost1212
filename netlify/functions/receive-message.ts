import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/conversationService';
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
});

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
      const newMessage = {
        id: Date.now().toString(),
        text: data.message,
        timestamp: new Date(),
        isUser: true,
        sender: 'Guest'
      };

      try {
        conversation = await conversationService.addConversation({
          Properties: [propertyId],
          'Guest Name': data.guestName || 'Guest',
          'Guest Email': data.guestEmail || '',
          'Guest phone number': data.guestPhone,
          Messages: JSON.stringify([newMessage]),
          'Auto Pilot': true
        });
        console.log('✅ New conversation created:', conversation.id);
      } catch (error) {
        console.error('❌ Failed to create conversation:', error);
        throw error;
      }
    }

    // Ajout du message à la conversation
    const newMessage = {
      id: Date.now().toString(),
      text: data.message,
      timestamp: new Date(data.timestamp || Date.now()),
      isUser: true,
      sender: data.platform
    };

    console.log('📨 Adding new message to conversation:', {
      conversationId: conversation.id,
      message: newMessage
    });

    const updatedMessages = [...(conversation.messages || []), newMessage];
    await conversationService.updateConversation(conversation.id, {
      Messages: JSON.stringify(updatedMessages),
    });

    console.log('📨 Message added to conversation');

    // Vérifier si Auto Pilot est activé
    const isAutoPilotEnabled = conversation['Auto Pilot'] === true;
    console.log('🤖 Auto Pilot status:', isAutoPilotEnabled ? 'ON' : 'OFF');

    // Générer une réponse AI seulement si Auto Pilot est activé
    if (isAutoPilotEnabled && property.aiInstructions && property.aiInstructions.length > 0) {
      console.log('💡 Generating AI response...');
      try {
        const aiResponse = await aiService.generateResponse(newMessage, property);
        if (aiResponse) {
          console.log('💡 AI response generated:', aiResponse);
          const aiMessage = {
            id: Date.now().toString(),
            text: aiResponse,
            timestamp: new Date(),
            isUser: false,
            sender: 'AI'
          };
          
          const messagesWithAiResponse = [...updatedMessages, aiMessage];
          await conversationService.updateConversation(conversation.id, {
            Messages: JSON.stringify(messagesWithAiResponse),
          });
          console.log('💡 AI response added to conversation');
        }
      } catch (aiError) {
        console.error('❌ Error generating AI response:', aiError);
      }
    } else {
      console.log('🤖 Skipping AI response:', !isAutoPilotEnabled ? 'Auto Pilot is OFF' : 'No AI instructions found');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        conversationId: conversation.id
      }),
    };
  } catch (error) {
    console.error('🚨 Error processing message:', error);
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
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};