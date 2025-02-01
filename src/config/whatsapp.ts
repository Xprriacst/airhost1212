export const whatsappConfig = {
  phoneNumberId: '461158110424411', // ID du numéro de téléphone configuré dans Airtable
  appId: process.env.WHATSAPP_APP_ID || '',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'airhost_whatsapp_webhook_123',
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
};
