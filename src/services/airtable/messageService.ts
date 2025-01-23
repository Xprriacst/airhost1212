import { base } from './config';
import { handleServiceError } from '../../utils/error';
import type { Message } from '../../types';

const NETLIFY_FUNCTION_URL = '/.netlify/functions/send-message';

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
  }
};