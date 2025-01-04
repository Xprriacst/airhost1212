import axios from 'axios';
import type { Message } from '../types';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/5hgt3th8jxpqg5dcfp54a5c139q7ys73';

export const messageService = {
  async sendMessage(message: Message, guestEmail: string, propertyId: string): Promise<void> {
    console.log('🚀 Attempting to send message to Make.com');
    console.log('Message details:', {
      text: message.text,
      guestEmail,
      propertyId,
      timestamp: message.timestamp,
      sender: message.sender
    });

    try {
      console.log('📤 Sending POST request to:', MAKE_WEBHOOK_URL);
      const response = await axios.post(MAKE_WEBHOOK_URL, {
        message: message.text,
        guestEmail,
        propertyId,
        timestamp: message.timestamp,
        sender: message.sender
      });
      console.log('✅ Message sent successfully to Make.com', response.data);
    } catch (error) {
      console.error('❌ Failed to send message to webhook:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      throw new Error('Failed to send message to external service');
    }
  }
};
