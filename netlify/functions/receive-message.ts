import { Handler } from '@netlify/functions';
import { z } from 'zod';

// Schéma de validation pour les messages WAAPI
const wapiMessageSchema = z.object({
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
        to: z.string()
      })
    })
  })
});

// Fonction pour formater le numéro de téléphone
const formatPhoneNumber = (phone: string): string => {
  // Supprimer tout ce qui n'est pas un chiffre
  const cleaned = phone.replace(/\D/g, '');
  
  // Supprimer le @c.us à la fin si présent
  const withoutSuffix = cleaned.replace(/@c\.us$/, '');
  
  // Ajouter le + si pas présent
  return withoutSuffix.startsWith('+') ? withoutSuffix : `+${withoutSuffix}`;
};

export const handler: Handler = async (event) => {
  console.log('🚀 WAAPI Webhook Called');
  console.log('Method:', event.httpMethod);
  console.log('Headers:', event.headers);
  
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
    const data = wapiMessageSchema.parse(body);
    console.log('✅ Validated WAAPI data:', JSON.stringify(data, null, 2));

    // Ne traiter que les messages entrants (non envoyés par nous)
    if (data.data.message._data.id.fromMe) {
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

    // Construire l'URL absolue pour receive-message
    const host = event.headers.host;
    const protocol = event.headers['x-forwarded-proto'] || 'https';
    const baseUrl = `${protocol}://${host}`;
    const receiveMessageUrl = `${baseUrl}/.netlify/functions/receive-message`;

    // Formater le numéro de téléphone
    const guestPhone = formatPhoneNumber(data.data.message._data.from);
    console.log('📱 Formatted phone number:', guestPhone);

    // Transférer le message au endpoint receive-message
    const messagePayload = {
      propertyId: 'rec7L9Jpo7DhgVoBR', // ID de la propriété par défaut
      message: data.data.message._data.body,
      guestPhone,
      webhookId: `${Date.now()}--${data.data.message._data.id._serialized}`,
      waNotifyName: data.data.message._data.notifyName // Ajouter le nom affiché
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
      throw new Error(`Failed to forward message: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('✅ Message forwarded successfully:', result);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        messageId: messagePayload.webhookId
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
