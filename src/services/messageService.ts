import axios from 'axios';
import type { Message } from '../types';

// URL du webhook Make.com
const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';

export const messageService = {
  async sendMessage(message: Message, guestPhone: string, propertyId: string, guestName: string): Promise<void> {
    console.group('🚀 messageService.sendMessage');
    try {
      console.log('Input parameters:', {
        messageText: message.text,
        guestPhone,
        guestName,
        propertyId,
        fullMessage: message
      });

      // Validation
      if (!message?.text) {
        console.error('❌ Invalid message:', message);
        throw new Error('Message text is required');
      }

      if (!guestPhone) {
        console.error('❌ Guest phone number is required');
        throw new Error('Guest phone number is required');
      }

      if (!guestName) {
        console.error('❌ Guest name is required');
        throw new Error('Guest name is required');
      }

      if (!propertyId) {
        console.error('❌ Property ID is required');
        throw new Error('Property ID is required');
      }

      // Préparer le payload
      const payload = {
        message: message.text,
        guestPhone,
        guestName,
        propertyId,
        timestamp: message.timestamp,
        sender: message.sender
      };

      // Envoyer à Make.com
      console.log('📤 Sending to Make.com:', payload);
      const response = await axios.post(MAKE_WEBHOOK_URL, payload);
      console.log('✅ Make.com response:', response.data);
      
    } catch (error) {
      console.error('❌ Error in messageService.sendMessage:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
};
