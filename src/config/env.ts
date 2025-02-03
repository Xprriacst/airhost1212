import { z } from 'zod';

// Validation avec zod pour garantir que les variables sont présentes
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

// Type pour l'environnement
type Env = z.infer<typeof envSchema>;

// Fonction pour récupérer les variables d'environnement
const getEnvVar = (key: string): string => {
  const viteKey = `VITE_${key}`;
  try {
    // Contexte Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[viteKey] || import.meta.env[key] || '';
    }
  } catch {
    // Ignorer si import.meta.env n'est pas disponible
  }

  // Contexte Node.js (Netlify Functions)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[viteKey] || process.env[key] || '';
  }

  return '';
};

// Configuration de l'environnement
const config: Env = {
  airtable: {
    apiKey: getEnvVar('AIRTABLE_API_KEY'),
    baseId: getEnvVar('AIRTABLE_BASE_ID'),
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
    model: 'gpt-4',
  },
  whatsapp: {
    appId: getEnvVar('WHATSAPP_APP_ID'),
    accessToken: getEnvVar('WHATSAPP_ACCESS_TOKEN'),
    verifyToken: getEnvVar('WHATSAPP_VERIFY_TOKEN'),
    apiVersion: getEnvVar('WHATSAPP_API_VERSION'),
  },
};

// Validation de la configuration
const validateConfig = (config: Env): boolean => {
  try {
    envSchema.parse(config);
    return true;
  } catch (error) {
    console.error('Configuration invalide:', error);
    return false;
  }
};

// Export des valeurs validées
export const isConfigValid = validateConfig(config);
export const env = isConfigValid ? config : null;
