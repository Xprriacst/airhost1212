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

      const conversation = await base('Conversations').find(conversationId);
      const existingMessages = JSON.parse(conversation.get('Messages') || '[]');
      
      const updatedMessages = [...existingMessages, message];
      
      await base('Conversations').update(conversationId, {
        Messages: JSON.stringify(updatedMessages)
      });

      return true;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  },

  async sendMessage(message: Message, guestPhone: string, propertyId: string): Promise<boolean> {
    try {
      console.log('📤 Sending message to Netlify function:', {
        message: message.text,
        guestPhone,
        propertyId,
      });

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
        console.error('❌ Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Message sent successfully:', result);
      return true;
    } catch (error) {
      console.error('❌ Error in sendMessage:', error);
      throw error;
    }
  }
};