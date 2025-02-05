import Airtable from 'airtable';

export const getEnvVar = (key: string): string => {
  return process.env[key] || '';
};

export const config = {
  airtable: {
    apiKey: getEnvVar('VITE_AIRTABLE_API_KEY'),
    baseId: getEnvVar('VITE_AIRTABLE_BASE_ID'),
  },
  whatsapp: {
    verifyToken: getEnvVar('VITE_WHATSAPP_VERIFY_TOKEN'),
    apiVersion: getEnvVar('VITE_WHATSAPP_API_VERSION'),
    appSecret: getEnvVar('WHATSAPP_APP_SECRET'),
  },
};

export const initializeAirtableBase = () => {
  return new Airtable({ apiKey: config.airtable.apiKey }).base(config.airtable.baseId);
};

export const base = initializeAirtableBase();
