import { Handler } from '@netlify/functions';
import { z } from 'zod';
import { propertyService } from '../../src/services/airtable/propertyService';
import { conversationService } from '../../src/services/conversationService';
import { aiService } from '../../src/services/ai/aiService';

// Schéma de validation pour les messages entrants
const messageSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  guestName: z.string().min(1, 'Guest Name is required'),
  guestEmail: z.string().email('A valid email is required'),
  message: z.string().min(1, 'Message cannot be empty'),
  platform: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
  timestamp: z.string().optional(),
  checkInDate: z.string().optional(),
  checkOutDate: z.string().optional(),
});

export const handler: Handler = async (event) => {
  console.log(' Receive Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);

  if (event.httpMethod !== 'POST') {
    console.warn(' Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log(' Raw request body:', event.body);

    const body = JSON.parse(event.body || '{}');
    console.log(' Parsed body:', body);

    const data = messageSchema.parse(body);
    console.log(' Validated data:', data);

    // Recherche de la propriété
    console.log(' Searching for property:', data.propertyId);
    const properties = await propertyService.getProperties();
    const property = properties.find((p) => p.id === data.propertyId);

    if (!property) {
      console.error(' Property not found for ID:', data.propertyId);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Property not found' }),
      };
    }
    console.log(' Property found:', property);

    // Récupération des conversations pour cette propriété
    console.log(' Fetching conversations for property:', data.propertyId);
    const conversations = await conversationService.fetchPropertyConversations(data.propertyId);
    console.log('Found conversations:', conversations.length);

    // Vérification si une conversation existe pour cet email
    let conversation = conversations.find(
      (conv) => conv.guestEmail?.toLowerCase() === data.guestEmail.toLowerCase()
    );

    if (conversation) {
      console.log(' Found existing conversation:', conversation.id);
    } else {
      console.log(' Creating new conversation for guest:', data.guestEmail);
      // Création d'une nouvelle conversation
      conversation = await conversationService.addConversation({
        Properties: [data.propertyId],
        'Guest Name': data.guestName,
        'Guest Email': data.guestEmail,
        Messages: '[]',
        'Check-in Date': data.checkInDate,
        'Check-out Date': data.checkOutDate,
      });
      console.log(' New conversation created:', conversation.id);
    }

    // Ajout du message à la conversation
    const newMessage = {
      id: Date.now().toString(),
      text: data.message,
      timestamp: new Date(data.timestamp || Date.now()),
      isUser: true,
      sender: data.platform
    };

    console.log(' Adding new message to conversation:', {
      conversationId: conversation.id,
      message: newMessage
    });

    const updatedMessages = [...(conversation.messages || []), newMessage];
    await conversationService.updateConversation(conversation.id, {
      Messages: JSON.stringify(updatedMessages),
    });

    console.log(' Message added to conversation');

    // Générer une réponse AI si l'autopilot est activé
    if (property.aiInstructions && property.aiInstructions.length > 0) {
      console.log(' Generating AI response...');
      try {
        const aiResponse = await aiService.generateResponse(newMessage, property);
        if (aiResponse) {
          console.log(' AI response generated:', aiResponse);
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
          console.log(' AI response added to conversation');
        }
      } catch (aiError) {
        console.error(' Error generating AI response:', aiError);
      }
    } else {
      console.log(' AI response not needed - no AI instructions found');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        conversationId: conversation.id
      }),
    };
  } catch (error) {
    console.error(' Error processing message:', error);
    if (error instanceof z.ZodError) {
      console.error('Validation errors:', error.errors);
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