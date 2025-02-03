import { z } from 'zod';

const envSchema = z.object({
  airtable: z.object({
    apiKey: z.string().min(1, 'Airtable API key is required'),
    baseId: z.string().min(1, 'Airtable Base ID is required'),
  }),
  openai: z.object({
    apiKey: z.string().min(1, 'OpenAI API key is required'),
    model: z.string().optional(),
  }),
  whatsapp: z.object({
    appId: z.string().min(1, 'WhatsApp App ID is required'),
    accessToken: z.string().min(1, 'WhatsApp Access Token is required'),
    verifyToken: z.string().min(1, 'WhatsApp Verify Token is required'),
    apiVersion: z.string().min(1, 'WhatsApp API Version is required'),
  }),
});

export const env = {
  airtable: {
    apiKey: import.meta.env.VITE_AIRTABLE_API_KEY || '',
    baseId: import.meta.env.VITE_AIRTABLE_BASE_ID || '',
  },
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    model: 'gpt-4',
  },
  whatsapp: {
    appId: import.meta.env.WHATSAPP_APP_ID || '',
    accessToken: import.meta.env.WHATSAPP_ACCESS_TOKEN || '',
    verifyToken: import.meta.env.WHATSAPP_VERIFY_TOKEN || '',
    apiVersion: import.meta.env.WHATSAPP_API_VERSION || '',
  },
};

export const isConfigValid = (() => {
  try {
    envSchema.parse(env);
    return true;
  } catch (error) {
    console.error('Configuration invalide:', error);
    return false;
  }
})();
