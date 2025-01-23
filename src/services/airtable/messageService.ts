import { base } from './config';
import { handleServiceError } from '../../utils/error';
import type { Message } from '../../types';

const NETLIFY_FUNCTION_URL = '/.netlify/functions/send-message';

export class MessageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MessageError';
  }
}

export const messageService = {
  async addMessageToConversation(
    conversationId: string,
    message: Message
  ): Promise<boolean> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!conversationId) throw new Error('Conversation ID is required');

      try {
        const conversation = await base('Conversations').find(conversationId);
        if (!conversation) {
          console.error('Conversation not found:', conversationId);
          return false;
        }

        try {
          // Parse existing messages safely
          const existingMessagesStr = conversation.get('Messages');
          if (!existingMessagesStr || typeof existingMessagesStr !== 'string') {
            console.warn('No messages found or invalid format:', existingMessagesStr);
            return false;
          }

          const cleanedString = existingMessagesStr.trim();
          if (!cleanedString) {
            console.warn('Empty messages string');
            return false;
          }

          const existingMessages = JSON.parse(cleanedString);
          if (!Array.isArray(existingMessages)) {
            console.warn('Messages is not an array:', existingMessages);
            return false;
          }

          // Add the new message
          existingMessages.push(message);

          // Update conversation with new messages
          await base('Conversations').update(conversationId, {
            Messages: JSON.stringify(existingMessages)
          });

          return true;
        } catch (error) {
          console.error('Error parsing messages:', error);
          return false;
        }
      } catch (error) {
        console.error('Error updating conversation:', error);
        return false;
      }
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  async sendMessage(message: Message, guestPhone: string, propertyId: string): Promise<boolean> {
    try {
      console.log('📤 Préparation de l\'envoi du message:', {
        message: message.text,
        guestPhone,
        propertyId,
      });

      // 1. Envoyer le message via la fonction Netlify
      const response = await fetch(NETLIFY_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.text,
          guestPhone,
          propertyId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Erreur d\'envoi du message:', error);
        throw new Error(`Échec de l'envoi: ${error.message || 'Erreur inconnue'}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        console.error('❌ Échec de l\'envoi:', result);
        throw new Error(result.error || 'Échec de l\'envoi du message');
      }

      console.log('✅ Message envoyé avec succès:', result);
      return true;

    } catch (error) {
      console.error('❌ Erreur dans sendMessage:', error);
      throw error;
    }
  },

  async sendMessageWithValidation({ text, conversationId, propertyId, guestPhone }: any): Promise<void> {
    try {
      // 1. Validation des paramètres
      const missingFields = [];
      if (!text) missingFields.push('text');
      if (!conversationId) missingFields.push('conversationId');
      if (!propertyId) missingFields.push('propertyId');
      if (!guestPhone) missingFields.push('guestPhone');

      if (missingFields.length > 0) {
        throw new MessageError(
          'Paramètres manquants pour l\'envoi du message',
          'MISSING_FIELDS',
          { missingFields }
        );
      }

      // 2. Validation du numéro de téléphone
      if (!/^\+?[1-9]\d{1,14}$/.test(guestPhone.replace(/\D/g, ''))) {
        throw new MessageError(
          'Format du numéro de téléphone invalide',
          'INVALID_PHONE_FORMAT',
          { providedPhone: guestPhone }
        );
      }

      // 3. Appel à la fonction Netlify
      const response = await fetch('/.netlify/functions/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          conversationId,
          propertyId,
          guestPhone
        })
      });

      // 4. Gestion des erreurs de la fonction Netlify
      if (!response.ok) {
        const errorData = await response.json();
        
        throw new MessageError(
          errorData.error || 'Erreur lors de l\'envoi du message',
          errorData.code || 'SEND_MESSAGE_ERROR',
          errorData.details
        );
      }

      // 5. Succès
      const data = await response.json();
      return data;

    } catch (error) {
      console.error('❌ Erreur dans messageService.sendMessage:', error);
      
      if (error instanceof MessageError) {
        throw error;
      }

      throw new MessageError(
        'Erreur inattendue lors de l\'envoi du message',
        'UNEXPECTED_ERROR',
        error instanceof Error ? error.message : String(error)
      );
    }
  },

  validateMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      console.warn('⚠️ Message invalide:', message);
      return false;
    }

    // Vérifier les champs requis
    const requiredFields = ['text', 'sender'];
    const missingFields = requiredFields.filter(field => !message[field]);

    if (missingFields.length > 0) {
      console.warn('⚠️ Champs manquants dans le message:', {
        message,
        missingFields
      });
      return false;
    }

    // Vérifier le type de sender
    if (!['host', 'guest', 'ai'].includes(message.sender.toLowerCase())) {
      console.warn('⚠️ Type d\'expéditeur invalide:', message.sender);
      return false;
    }

    return true;
  }
};