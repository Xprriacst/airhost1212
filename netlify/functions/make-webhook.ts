import { Handler } from '@netlify/functions';
import { z } from 'zod';
import fetch from 'node-fetch';

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

// Schéma de validation pour les messages de Make.com
const makeMessageSchema = z.object({
  propertyId: z.string(),
  message: z.string(),
  guestPhone: z.string(),
  webhookId: z.string()
});

// Fonction pour formater le numéro de téléphone
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '').replace(/@c\.us$/, '');
  const withoutLeadingZero = cleaned.replace(/^0/, '');
  return withoutLeadingZero.startsWith('33') 
    ? `+${withoutLeadingZero}`
    : `+33${withoutLeadingZero}`;
};

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
    let wapiData;
    try {
      wapiData = waapiMessageSchema.parse(body);
    } catch (error) {
      // Valider le message Make
      const makeData = makeMessageSchema.parse(body);
      console.log('✅ Validated Make data:', JSON.stringify(makeData, null, 2));

      // Construire l'URL pour receive-message en utilisant le host de la requête
      const host = event.headers.host || 'whimsical-beignet-91329f.netlify.app';
      const protocol = event.headers['x-forwarded-proto'] || 'https';
      const receiveMessageUrl = `${protocol}://${host}/.netlify/functions/receive-message`;
      
      // Transférer le message au endpoint receive-message
      const messagePayload = {
        propertyId: makeData.propertyId,
        message: makeData.message,
        guestPhone: makeData.guestPhone,
        platform: 'whatsapp',
        webhookId: makeData.webhookId,
        waMessageId: makeData.webhookId,
        timestamp: new Date().toISOString()
      };

      console.log('📤 Forwarding to receive-message:', {
        url: receiveMessageUrl,
        payload: messagePayload
      });

      const response = await fetch(receiveMessageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messagePayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to forward message: ${response.status} ${response.statusText}\n${errorText}`);
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
    }

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

    // Formater le numéro de téléphone
    const phoneNumber = formatPhoneNumber(wapiData.data.message._data.from);
    
    // Construire l'URL pour receive-message en utilisant le host de la requête
    const host = event.headers.host || 'whimsical-beignet-91329f.netlify.app';
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const receiveMessageUrl = `${protocol}://${host}/.netlify/functions/receive-message`;
    
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

    console.log('📤 Forwarding to receive-message:', {
      url: receiveMessageUrl,
      payload: messagePayload
    });

    const response = await fetch(receiveMessageUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messagePayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to forward message: ${response.status} ${response.statusText}\n${errorText}`);
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
