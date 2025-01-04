import { Handler } from '@netlify/functions';
import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const handler: Handler = async (event) => {
  console.log('🚀 Send Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);

  if (event.httpMethod !== 'POST') {
    console.warn('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    console.log('📦 Parsed payload:', payload);

    // Validation
    if (!payload.message || !payload.guestEmail || !payload.propertyId) {
      console.error('❌ Missing required fields in payload:', {
        hasMessage: Boolean(payload.message),
        hasGuestEmail: Boolean(payload.guestEmail),
        hasPropertyId: Boolean(payload.propertyId)
      });
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          details: {
            message: !payload.message ? 'Message is required' : undefined,
            guestEmail: !payload.guestEmail ? 'Guest email is required' : undefined,
            propertyId: !payload.propertyId ? 'Property ID is required' : undefined
          }
        }),
      };
    }

    // Tentatives d'envoi avec retry
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`📤 Attempt ${attempt}/${MAX_RETRIES} to send message to Make.com`);
        const response = await axios.post(MAKE_WEBHOOK_URL, payload, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });

        console.log('✅ Make.com response:', response.data);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            success: true,
            makeResponse: response.data 
          }),
        };
      } catch (error) {
        console.error(`❌ Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        
        if (axios.isAxiosError(error)) {
          console.error('Error details:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
              url: error.config?.url,
              method: error.config?.method,
              headers: error.config?.headers,
              data: error.config?.data
            }
          });
        }
        
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        
        const delay = RETRY_DELAY * attempt;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await sleep(delay);
      }
    }

    throw new Error('All retry attempts failed');
  } catch (error) {
    console.error('❌ Error processing message:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};
