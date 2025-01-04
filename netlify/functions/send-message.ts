import { Handler } from '@netlify/functions';
import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event) => {
  console.log('🚀 Send Message Function Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  console.log('Body:', event.body);

  // Gérer les requêtes OPTIONS (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('👋 Handling OPTIONS request');
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    console.warn('❌ Method not allowed:', event.httpMethod);
    return {
      statusCode: 405,
      headers: corsHeaders,
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
        headers: corsHeaders,
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
        console.log('Sending to URL:', MAKE_WEBHOOK_URL);
        
        const response = await axios.post(MAKE_WEBHOOK_URL, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('✅ Message sent successfully to Make.com:', {
          status: response.status,
          data: response.data
        });

        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            success: true,
            message: 'Message sent successfully'
          })
        };
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        if (attempt < MAX_RETRIES) {
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.log(`⏳ Waiting ${delay}ms before next attempt...`);
          await sleep(delay);
        } else {
          throw error;
        }
      }
    }

    throw new Error('Failed to send message after all retries');
  } catch (error) {
    console.error('❌ Error in send-message function:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to send message',
        details: error.message
      })
    };
  }
};
