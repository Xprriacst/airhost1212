import { Handler } from '@netlify/functions';
import { z } from 'zod';

// Schéma de validation pour les messages WAAPI via Make.com
const waapiMessageSchema = z.object({
  event: z.string(),
  instanceId: z.string(),
  data: z.object({
    message: z.object({
      _data: z.object({
        id: z.object({
          fromMe: z.boolean(),
          remote: z.string(),
          id: z.string(),
          _serialized: z.string()
        }),
        body: z.string(),
        type: z.string(),
        t: z.number(),
        notifyName: z.string().optional(),
        from: z.string(),
        to: z.string(),
        isNewMsg: z.boolean().optional()
      })
    })
  })
});

export const handler: Handler = async (event) => {
  console.log('🚀 WAAPI Make.com Webhook Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));

  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    console.log('📦 Raw request body:', event.body);
    const body = JSON.parse(event.body || '{}');
    console.log('📦 Parsed body:', JSON.stringify(body, null, 2));

    // Valider le message WAAPI
    const wapiData = waapiMessageSchema.parse(body);
    console.log('✅ Validated WAAPI data:', JSON.stringify(wapiData, null, 2));

    // Ne pas traiter les messages sortants
    if (wapiData.data.message._data.id.fromMe) {
      console.log('⏭️ Skipping outgoing message');
      return {
        statusCode: 200,
        body: JSON.stringify({ 
          status: 'success',
          skipped: true,
          reason: 'outgoing_message'
        })
      };
    }

    // Formater le numéro de téléphone (retirer @c.us et formater pour la France)
    const phoneNumber = wapiData.data.message._data.from.replace('@c.us', '');
    
    // Transférer le message au endpoint receive-message
    const messagePayload = {
      propertyId: process.env.DEFAULT_PROPERTY_ID,
      message: wapiData.data.message._data.body,
      guestPhone: phoneNumber,
      guestName: wapiData.data.message._data.notifyName,
      platform: 'whatsapp',
      timestamp: new Date(wapiData.data.message._data.t * 1000).toISOString(),
      webhookId: wapiData.data.message._data.id._serialized,
      waMessageId: wapiData.data.message._data.id._serialized,
      waNotifyName: wapiData.data.message._data.notifyName,
      isHost: false
    };

    console.log('📤 Forwarding to receive-message:', messagePayload);

    const response = await fetch('/.netlify/functions/receive-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      throw new Error(`Failed to forward message: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Message forwarded successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        messageId: messagePayload.webhookId,
        forwardedResponse: result
      })
    };

  } catch (error) {
    console.error('❌ Error processing WAAPI webhook:', error);
    return {
      statusCode: error instanceof z.ZodError ? 400 : 500,
      body: JSON.stringify({ 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
