import { Handler } from '@netlify/functions';
import axios from 'axios';
import { conversationService } from '../../src/services/airtable/conversationService';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Fonction de formatage du numéro de téléphone pour la comparaison
const normalizePhoneNumber = (phone: string): string | null => {
  try {
    if (!phone) {
      console.warn('❌ Numéro de téléphone vide');
      return null;
    }

    // Supprimer tous les caractères non numériques
    let cleaned = phone.replace(/\D/g, '');

    // Si le numéro commence par un 0, le remplacer par +33
    if (cleaned.startsWith('0')) {
      cleaned = '33' + cleaned.substring(1);
    }

    // Si le numéro ne commence pas par un +, l'ajouter
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    // Vérifier que le numéro a une longueur valide (E.164)
    if (cleaned.length < 10 || cleaned.length > 15) {
      console.warn('❌ Longueur du numéro invalide:', cleaned.length);
      return null;
    }

    return cleaned;
  } catch (error) {
    console.error('❌ Erreur lors de la normalisation du numéro:', error);
    return null;
  }
};

// Fonction de formatage du numéro de téléphone pour WhatsApp
const formatPhoneForWhatsApp = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone);
  const formatted = `33${normalized.replace('+33', '')}@c.us`;
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
          requiredFields: ['message', 'guestPhone', 'propertyId']
        }),
      };
    }

    // Rechercher une conversation existante
    console.log(' Looking for existing conversation...');
    let conversation;
    
    // Si un conversationId est fourni, l'utiliser directement
    if (payload.conversationId) {
      try {
        conversation = await conversationService.getConversationWithoutAuth(payload.conversationId);
      } catch (error) {
        console.error(' Erreur lors de la récupération de la conversation par ID:', error);
      }
    }

    if (!conversation) {
      // Récupérer uniquement les conversations de la propriété
      const conversations = await conversationService.getPropertyConversationsWithoutAuth(payload.propertyId);
      console.log(` Trouvé ${conversations.length} conversations pour la propriété`);
      
      conversation = conversations.find(c => {
        if (!c['Guest phone number']) {
          console.warn(' Numéro de téléphone manquant pour la conversation:', c.id);
          return false;
        }
        const conversationPhone = normalizePhoneNumber(c['Guest phone number']);
        const phoneMatch = conversationPhone === normalizePhoneNumber(payload.guestPhone);
        if (phoneMatch) {
          console.log(' Correspondance trouvée:', {
            conversationId: c.id,
            originalPhone: c['Guest phone number'],
            normalizedPhone: conversationPhone
          });
        }
        return phoneMatch;
      });
    }

    if (!conversation) {
      console.error(' Conversation non trouvée');
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Conversation non trouvée' })
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

    console.log(' Ajout du message à la conversation:', {
      conversationId: conversation.id,
      message: newMessage
    });

    // Utiliser le champ messages de la conversation
    const currentMessages = conversation.messages || [];
    const updatedMessages = [...currentMessages, newMessage];
    await conversationService.updateConversationWithoutAuth(conversation.id, {
      messages: JSON.stringify(updatedMessages)
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

    console.log(' Envoi à Make.com:', {
      url: MAKE_WEBHOOK_URL,
      payload: makePayload
    });

    // Tentatives d'envoi avec retry
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(` Tentative ${attempt}/${MAX_RETRIES} pour envoyer le message à Make.com`);
        console.log('Envoi à l\'URL:', MAKE_WEBHOOK_URL);
        console.log('Payload d\'origine:', payload);
        
        const response = await axios.post(MAKE_WEBHOOK_URL, makePayload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log(' Message envoyé avec succès à Make.com:', {
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
          messages: JSON.stringify(sentMessages)
        });

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true,
            message: 'Message envoyé avec succès',
            messageId: newMessage.id
          })
        };
      } catch (error) {
        console.error(` Tentative ${attempt} échouée:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(` Attente de ${delay}ms avant la prochaine tentative...`);
          await sleep(delay);
        } else {
          // Marquer le message comme échoué
          const failedMessages = updatedMessages.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'failed' }
              : msg
          );

          await conversationService.updateConversationWithoutAuth(conversation.id, {
            messages: JSON.stringify(failedMessages)
          });

          throw error;
        }
      }
    }

    throw new Error('Échec de l\'envoi du message après toutes les tentatives');
  } catch (error) {
    console.error(' Erreur dans la fonction send-message:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Échec de l\'envoi du message',
        details: error.message
      })
    };
  }
};
