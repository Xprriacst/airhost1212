import { Message, Conversation } from '../../types';
import { getWhatsAppService } from '../whatsapp';
import { WhatsAppServiceConfig } from '../whatsapp/types';

class ConversationService {
  private usersTable: any; // Déclaration de la table des utilisateurs

  private async getWhatsAppConfig(userId: string): Promise<WhatsAppServiceConfig> {
    const user = await this.usersTable.find(userId);
    
    if (!user) {
      return {
        provider: 'make' // Provider par défaut
      };
    }

    const provider = user.get('whatsapp_provider') as WhatsAppProvider || 'make';
    
    if (provider === 'official') {
      const config = await whatsappBusinessAccountService.getAccountConfig(userId);
      if (!config) {
        throw new Error('Configuration WhatsApp non trouvée pour l\'utilisateur');
      }
      return {
        provider,
        ...config
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

      // 3. Envoyer le message via WhatsApp
      const messageId = await whatsappService.sendMessage(
        conversation.guestPhone,
        {
          type: message.type,
          text: message.text,
        }
      );

      // 4. Mettre à jour le statut du message avec l'ID WhatsApp
      const updatedMessage = {
        ...message,
        wa_message_id: messageId,
      };

      // 5. Mettre à jour la conversation dans Airtable
      const updatedMessages = [...conversation.messages, updatedMessage];
      await this.updateConversation(conversation.id, {
        Messages: JSON.stringify(updatedMessages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })))
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
