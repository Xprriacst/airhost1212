import OpenAI from 'openai';
import type { Message, Property } from '../../types';
import type { BookingContext, AIConfig } from './types';
import { buildPrompt } from './promptBuilder';

// Récupérer la clé API depuis les variables d'environnement Vite
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('La clé API OpenAI est manquante dans les variables d\'environnement');
}

const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true
});

export const aiService = {
  async generateResponse(
    lastMessage: Message,
    property: Property,
    bookingContext: BookingContext,
    previousMessages: Message[] = [],
    config: AIConfig = {}
  ): Promise<string> {
    try {
      const prompt = buildPrompt(lastMessage, property, bookingContext, previousMessages, config);

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erreur lors de la génération de la réponse:', error);
      throw error;
    }
  }
};