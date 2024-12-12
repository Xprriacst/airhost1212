import { base } from './config';
import { handleServiceError } from '../../utils/error';
import type { Message } from '../../types';

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
  }
};