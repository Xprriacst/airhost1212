import { getEnvVar } from '../../utils/env';
import { defaultConfig } from './defaults';
import { validateEnv, validateEnvVar } from './validation';
import type { EnvConfig } from './schema';

// Get environment variables with validation
const env: EnvConfig = {
  airtable: {
    apiKey: getEnvVar('AIRTABLE_API_KEY') || defaultConfig.airtable.apiKey,
    baseId: getEnvVar('AIRTABLE_BASE_ID') || defaultConfig.airtable.baseId,
  },
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY') || defaultConfig.openai.apiKey,
    model: 'gpt-4',
  },
};

// Validate required environment variables
['AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'OPENAI_API_KEY'].forEach(key => 
  validateEnvVar(key, getEnvVar(key))
);

// Validate entire configuration
validateEnv(env);

export { env, type EnvConfig };