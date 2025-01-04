import axios from 'axios';
import type { Message } from '../types';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 seconde

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 Sending POST request to Make.com (attempt ${attempt}/${MAX_RETRIES}):`, MAKE_WEBHOOK_URL);
        const response = await axios.post(MAKE_WEBHOOK_URL, {
          message: message.text,
          guestEmail,
          propertyId,
          timestamp: message.timestamp,
          sender: message.sender
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 secondes
        });
        
        console.log('✅ Message sent successfully to Make.com', response.data);
        return;
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        
        if (axios.isAxiosError(error)) {
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers
          });
          
          // Ne pas réessayer si c'est une erreur 4xx (sauf 429 - Too Many Requests)
          if (error.response?.status && error.response.status < 500 && error.response.status !== 429) {
            throw new Error(`Failed to send message: ${error.response.statusText}`);
          }
        }
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * attempt;
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await sleep(delay);
        }
      }
    }
    
    throw new Error(`Failed to send message after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  }
};
