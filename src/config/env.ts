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

// Fonction pour récupérer les variables d'environnement avec gestion des préfixes
const getEnvVar = (key: string, useVitePrefix = true): string => {
  const viteKey = useVitePrefix ? `VITE_${key}` : key;
  return import.meta.env[viteKey] || import.meta.env[key] || '';
};

export const env = {
  airtable: {
    apiKey: getEnvVar('AIRTABLE_API_KEY'),
    baseId: getEnvVar('AIRTABLE_BASE_ID'),
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
    model: 'gpt-4',
  },
  whatsapp: {
    // Pas de préfixe VITE_ pour les variables WhatsApp
    appId: getEnvVar('WHATSAPP_APP_ID', false),
    accessToken: getEnvVar('WHATSAPP_ACCESS_TOKEN', false),
    verifyToken: getEnvVar('WHATSAPP_VERIFY_TOKEN', false),
    apiVersion: getEnvVar('WHATSAPP_API_VERSION', false),
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
