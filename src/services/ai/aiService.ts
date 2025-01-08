import OpenAI from 'openai';
import { ContextBuilder } from './contextBuilder';
import { PromptBuilder } from './promptBuilder';
import type { Message, Property } from '../../types';
import type { AIResponseContext, BookingContext, AIConfig } from './types';
import { env } from '../../config/env';

const openai = new OpenAI({
  apiKey: env.openai.apiKey,
  dangerouslyAllowBrowser: true
});

export const aiService = {
  async generateResponse(
    message: Message,
    property: Property,
    bookingContext: BookingContext = { hasBooking: false },
    previousMessages: Message[] = [],
    config: AIConfig = {}
  ): Promise<string> {
    try {
      // Construction du contexte complet
      const context = ContextBuilder.buildContext(
        property,
        bookingContext,
        [...previousMessages, message]
      );

      // Génération des prompts
      const systemPrompt = PromptBuilder.buildSystemPrompt(context, config);
      const userPrompt = PromptBuilder.buildUserPrompt(message);

      console.log('Generating response with context:', {
        property: property.name,
        messageCount: previousMessages.length + 1,
        hasBooking: bookingContext.hasBooking
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini-2024-07-18",  // Version mini optimisée pour les tâches spécifiques
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response generated');
      }

      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate AI response');
    }
  }
};