import type { AIConfig, AIResponseContext } from '../../ai/types';

export const aiService = {
  generateResponse: jest.fn().mockImplementation(
    async (
      userMessage: string,
      context: AIResponseContext,
      config: AIConfig
    ): Promise<string> => {
      // Simuler une réponse basée sur le contexte
      const { guestName } = context;
      const { language } = config;

      return language === 'fr'
        ? `Bonjour ${guestName}, voici une réponse de test.`
        : `Hi ${guestName}, this is a test response.`;
    }
  )
};
