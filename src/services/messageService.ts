import axios from 'axios';
import type { Message } from '../types';

// L'URL complète de l'application
const BASE_URL = 'https://whimsical-beignet-91329f.netlify.app';

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

      // Utiliser l'URL complète
      const url = `${BASE_URL}/.netlify/functions/send-message`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      };

      console.log('📦 Request details:', {
        url,
        method: 'POST',
        headers: config.headers,
        payload,
        timeout: config.timeout
      });

      // Envoyer la requête
      console.log('📤 Sending POST request to Netlify function...');
      try {
        const response = await axios.post(url, payload, config);
        
        console.log('✅ Response from Netlify function:', {
          status: response.status,
          statusText: response.statusText,
          data: response.data,
          headers: response.headers
        });

        if (!response.data.success) {
          console.error('❌ Function returned error:', response.data.error);
          throw new Error(response.data.error || 'Failed to send message');
        }
      } catch (axiosError) {
        console.error('❌ Axios error:', axiosError);
        if (axios.isAxiosError(axiosError)) {
          console.error('Error details:', {
            status: axiosError.response?.status,
            statusText: axiosError.response?.statusText,
            data: axiosError.response?.data,
            config: {
              url: axiosError.config?.url,
              method: axiosError.config?.method,
              headers: axiosError.config?.headers,
              data: axiosError.config?.data
            },
            message: axiosError.message
          });
        }
        throw new Error('Failed to send message to webhook');
      }
    } catch (error) {
      console.error('❌ Error in messageService.sendMessage:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
};
