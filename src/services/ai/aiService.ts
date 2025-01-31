import OpenAI from 'openai';
import type { Message, Property } from '../../types';
import type { BookingContext, AIConfig } from './types';
import { buildPrompt } from './promptBuilder';

// Récupérer la clé API depuis les variables d'environnement
let apiKey: string;

if (typeof process !== 'undefined' && process.env.NODE_ENV === 'test') {
  apiKey = 'test-key';
} else {
  // @ts-ignore
  apiKey = import.meta.env.VITE_OPENAI_API_KEY;
}

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
      console.log('Début de la génération de réponse avec:', {
        lastMessage,
        property: property.name,
        bookingContext,
        messagesCount: previousMessages.length,
        config
      });

      const prompt = buildPrompt(lastMessage, property, bookingContext, previousMessages, config);
      console.log('Prompt généré:', prompt);

      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      });

      console.log('Réponse reçue de OpenAI:', response.choices[0]?.message?.content);

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Erreur détaillée lors de la génération de la réponse:', error);
      throw error;
    }
  }
};