import axios from 'axios';
import type { Message } from '../types';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/5hgt3th8jxpqg5dcfp54a5c139q7ys73';

export const messageService = {
  async sendMessage(message: Message, guestEmail: string, propertyId: string): Promise<void> {
    try {
      // Send message to Make.com webhook
      await axios.post(MAKE_WEBHOOK_URL, {
        message: message.text,
        guestEmail,
        propertyId,
        timestamp: message.timestamp,
        sender: message.sender
      });
    } catch (error) {
      console.error('Failed to send message to webhook:', error);
      throw new Error('Failed to send message to external service');
    }
  }
};
