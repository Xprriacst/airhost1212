import { Message, Conversation } from '../../types';
import { getWhatsAppService } from '../whatsapp';
import { WhatsAppServiceConfig } from '../whatsapp/types';

class ConversationService {
  private usersTable = base('Users'); // Déclaration de la table des utilisateurs

  private async getWhatsAppConfig(userId: string): Promise<WhatsAppServiceConfig> {
    const user = await this.usersTable.find(userId);
    
    if (!user) {
      return {
        provider: 'make' // Provider par défaut
      };
    }

    const provider = user.get('whatsapp_provider') as WhatsAppProvider || 'make';
    
    if (provider === 'official') {
      return {
        provider,
        appId: process.env.WHATSAPP_APP_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
        phoneNumberId: user.get('whatsapp_phone_number_id') as string,
        apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
      };
    }

    return {
      provider
    };
  }

  async fetchConversationById(userId: string, conversationId: string): Promise<Conversation> {
    // Votre code existant pour fetchConversationById
    throw new Error('Not implemented');
  }

  async updateConversation(conversationId: string, updates: any): Promise<void> {
    // Votre code existant pour updateConversation
    throw new Error('Not implemented');
  }

  async sendMessage(userId: string, conversation: Conversation, message: Message): Promise<void> {
    try {
      // 1. Obtenir la configuration WhatsApp de l'utilisateur
      const whatsappConfig = await this.getWhatsAppConfig(userId);
      
      // 2. Obtenir le service WhatsApp approprié
      const whatsappService = getWhatsAppService(whatsappConfig);
      
      // 3. Envoyer le message
      const messageId = await whatsappService.sendMessage(conversation.phone_number, {
        type: 'text',
        text: message.text
      });

      // 4. Mettre à jour le statut du message
      if (messageId) {
        message.status = 'sent';
        message.metadata = {
          ...message.metadata,
          whatsapp: {
            messageId,
            provider: whatsappConfig.provider
          }
        };
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
