import Airtable from 'airtable';
import { env, isConfigValid } from '../../config/env';

export const initializeAirtableBase = () => {
  if (!isConfigValid) {
    console.warn('Airtable configuration is invalid. Using mock data.');
    return null;
  }

  return new Airtable({ apiKey: env.airtable.apiKey }).base(env.airtable.baseId);
};

export const base = initializeAirtableBase();