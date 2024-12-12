import OpenAI from 'openai';
import { env, isConfigValid } from '../../config/env';

export const initializeOpenAI = () => {
  if (!isConfigValid) {
    console.warn('OpenAI configuration is invalid. AI features will use mock responses.');
    return null;
  }

  return new OpenAI({
    apiKey: env.openai.apiKey,
    dangerouslyAllowBrowser: true
  });
};

export const openai = initializeOpenAI();