import axios from 'axios';
import type { Message } from '../types';

export const messageService = {
  async sendMessage(message: Message, guestEmail: string, propertyId: string): Promise<void> {
    console.log('🚀 messageService.sendMessage called with:', {
      messageText: message.text,
      guestEmail,
      propertyId
    });

    if (!message?.text) {
      console.error('❌ Invalid message:', message);
      throw new Error('Message text is required');
    }

    if (!guestEmail) {
      console.error('❌ Guest email is required');
      throw new Error('Guest email is required');
    }

    if (!propertyId) {
      console.error('❌ Property ID is required');
      throw new Error('Property ID is required');
    }

    const payload = {
      message: message.text,
      guestEmail,
      propertyId,
      timestamp: message.timestamp,
      sender: message.sender
    };

    console.log('📦 Request payload:', payload);
    console.log('🔍 Request URL:', '/.netlify/functions/send-message');

    try {
      console.log('📤 Sending POST request to Netlify function...');
      const response = await axios.post('/.netlify/functions/send-message', payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('✅ Response from Netlify function:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (!response.data.success) {
        console.error('❌ Function returned error:', response.data.error);
        throw new Error(response.data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      if (axios.isAxiosError(error)) {
        console.error('Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            headers: error.config?.headers
          }
        });
      }
      throw new Error('Failed to send message to webhook');
    }
  }
};
