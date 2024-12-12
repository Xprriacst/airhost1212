import { envSchema } from './schema';
import type { EnvConfig } from './schema';

export const validateEnv = (config: EnvConfig): boolean => {
  try {
    envSchema.parse(config);
    console.log('✅ Environment configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Environment validation failed:', error);
    return false;
  }
};

export const validateEnvVar = (key: string, value: string | undefined): void => {
  if (!value) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
};