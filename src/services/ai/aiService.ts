import { AIResponseContext } from '../../types';

export const aiService = {
  generateResponse: async (context: AIResponseContext): Promise<string> => {
    try {
      // Simuler une réponse AI pour les tests
      const lastMessage = context.previousMessages[context.previousMessages.length - 1];
      return `Bonjour ${context.guestName} ! 👋
Je suis ravi de vous aider pendant votre séjour à ${context.propertyName}.
En réponse à votre message "${lastMessage.content}":
N'hésitez pas si vous avez besoin de quoi que ce soit !`;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }
};
