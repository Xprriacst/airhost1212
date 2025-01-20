import { Handler } from '@netlify/functions';
import axios from 'axios';
import { conversationService } from '../../src/services/airtable/conversationService';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Fonction de formatage du numéro de téléphone pour la comparaison
const normalizePhoneNumber = (phone: string): string => {
  const normalized = phone
    .replace(/^\+/, '')     // Supprimer le + initial s'il existe
    .replace(/\D/g, '')     // Supprimer tous les autres caractères non numériques
    .replace(/^0/, '')      // Supprimer le 0 initial s'il existe
    .replace(/^33/, '');    // Supprimer le 33 initial s'il existe
  console.log(' Normalized phone:', normalized);
  return normalized;
};

// Fonction de formatage du numéro de téléphone pour WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone);
  const formatted = `33${normalized}@c.us`;
  console.log(' Formatted phone for WhatsApp:', {
    original: phone,
    normalized,
    formatted
  });
  return formatted;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  console.log(' Send Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  console.log('Raw body:', event.body);

  // Gérer les requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log(' Handling OPTIONS request');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.warn(' Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log(' Parsed payload:', JSON.stringify(payload, null, 2));

    // Validation
    if (!payload.message || !payload.guestPhone || !payload.propertyId) {
      console.error(' Missing required fields in payload:', {
        hasMessage: Boolean(payload.message),
        hasGuestPhone: Boolean(payload.guestPhone),
        hasPropertyId: Boolean(payload.propertyId)
      });
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            message: !payload.message ? 'Message is required' : undefined,
            guestPhone: !payload.guestPhone ? 'Guest phone is required' : undefined,
            propertyId: !payload.propertyId ? 'Property ID is required' : undefined
          }
        }),
      };
    }

    // Récupérer la conversation
    console.log(' Fetching all conversations...');
    const conversations = await conversationService.getAllConversationsWithoutAuth();
    console.log(` Found ${conversations.length} conversations`);
    
    // Si un conversationId est fourni, l'utiliser directement
    let conversation;
    if (payload.conversationId) {
      conversation = conversations.find(c => c.id === payload.conversationId);
    } else {
      // Sinon chercher par numéro de téléphone
      conversation = conversations.find(c => normalizePhoneNumber(c['Guest phone number']) === normalizePhoneNumber(payload.guestPhone));
    }

    if (!conversation) {
      console.error(' Conversation not found');
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Conversation not found' })
      };
    }

    // Ajouter le message à la conversation
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: payload.message,
      timestamp: new Date(),
      sender: 'host',
      type: 'text',
      status: 'pending'
    };

    console.log(' Adding message to conversation:', {
      conversationId: conversation.id,
      message: newMessage
    });

    const currentMessages = conversation.Messages ? JSON.parse(conversation.Messages) : [];
    const updatedMessages = [...currentMessages, newMessage];
    await conversationService.updateConversationWithoutAuth(conversation.id, {
      Messages: JSON.stringify(updatedMessages)
    });

    // Formater le message
    const formattedMessage = payload.message
      .replace(/\n{2,}/g, ' ')
      .replace(/\n/g, ' ');

    // Créer le payload pour Make exactement comme attendu
    const makePayload = {
      chatId: formatPhoneForWhatsApp(payload.guestPhone),
      message: formattedMessage
    };

    console.log(' Sending to Make.com:', {
      url: MAKE_WEBHOOK_URL,
      payload: makePayload
    });

    // Tentatives d'envoi avec retry
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(` Attempt ${attempt}/${MAX_RETRIES} to send message to Make.com`);
        console.log('Sending to URL:', MAKE_WEBHOOK_URL);
        console.log('Original payload:', payload);
        
        const response = await axios.post(MAKE_WEBHOOK_URL, makePayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log(' Message sent successfully to Make.com:', {
          status: response.status,
          data: response.data
        });

        // Marquer le message comme envoyé
        const sentMessages = updatedMessages.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, status: 'sent' }
            : msg
        );

        await conversationService.updateConversationWithoutAuth(conversation.id, {
          Messages: JSON.stringify(sentMessages)
        });

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true,
            message: 'Message sent successfully',
            messageId: newMessage.id
          })
        };
      } catch (error) {
        console.error(` Attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(` Waiting ${delay}ms before next attempt...`);
          await sleep(delay);
        } else {
          // Marquer le message comme échoué
          const failedMessages = updatedMessages.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'failed' }
              : msg
          );

          await conversationService.updateConversationWithoutAuth(conversation.id, {
            Messages: JSON.stringify(failedMessages)
          });

          throw error;
        }
      }
    }

    throw new Error('Failed to send message after all retries');
  } catch (error) {
    console.error(' Error in send-message function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to send message',
        details: error.message
      })
    };
  }
};
