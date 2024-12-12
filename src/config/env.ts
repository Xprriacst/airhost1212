import { z } from 'zod';

// Validation avec zod pour garantir que les variables sont présentes
const envSchema = z.object({
  airtable: z.object({
    apiKey: z.string().min(1, 'Airtable API key is required'),
    baseId: z.string().min(1, 'Airtable Base ID is required'),
  }),
  openai: z.object({
    apiKey: z.string().min(1, 'OpenAI API key is required'),
  }),
});

// Fonction pour récupérer les variables d'environnement
const getEnvVar = (key: string): string => {
  try {
    // Contexte Vite
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env[key] || '';
    }
  } catch {
    // Ignorer si import.meta.env n'est pas disponible
  }

  // Contexte Node.js (Netlify Functions)
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }

  return '';
};

// Variables d'environnement
export const env = {
  airtable: {
    apiKey: getEnvVar('AIRTABLE_API_KEY') || getEnvVar('VITE_AIRTABLE_API_KEY'),
    baseId: getEnvVar('AIRTABLE_BASE_ID') || getEnvVar('VITE_AIRTABLE_BASE_ID'),
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY') || getEnvVar('VITE_OPENAI_API_KEY'),
  },
};

// Validation des variables d'environnement
const validateEnv = () => {
  try {
    envSchema.parse(env);
    console.log('Environment variables are valid.');
    return true;
  } catch (error) {
    console.error('Environment validation failed:', error);
    return false;
  }
};

export const isConfigValid = validateEnv();
