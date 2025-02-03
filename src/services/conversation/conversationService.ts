import { Message, Conversation } from '../../types';
import { getWhatsAppService } from '../whatsapp';
import { WhatsAppServiceConfig, WhatsAppProvider } from '../whatsapp/types';
import { base } from '../airtable';

class ConversationService {
  private usersTable = base('Users');

  private async getWhatsAppConfig(userId: string): Promise<WhatsAppServiceConfig> {
    try {
      const user = await this.usersTable.find(userId);
      
      if (!user) {
        console.warn('⚠️ Utilisateur non trouvé, utilisation du provider par défaut');
        return {
          provider: 'make'
        };
      }

      const provider = user.get('whatsapp_provider') as WhatsAppProvider || 'make';
      console.log('📱 Provider WhatsApp:', provider);
      
      if (provider === 'official') {
        const phoneNumberId = user.get('whatsapp_phone_number_id');
        if (!phoneNumberId) {
          throw new Error('Phone Number ID manquant pour l\'utilisateur');
        }

        const config = {
          provider,
          appId: process.env.WHATSAPP_APP_ID,
          accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
          apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
          phoneNumberId,
          apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
        };

        console.log('✅ Configuration WhatsApp officielle chargée');
        return config;
      }

      console.log('✅ Configuration Make chargée');
      return { provider };
    } catch (error) {
      console.error('❌ Erreur lors du chargement de la configuration WhatsApp:', error);
      throw error;
    }
  }

  async fetchConversationById(userId: string, conversationId: string): Promise<Conversation> {
    // À implémenter selon vos besoins
    throw new Error('Not implemented');
  }

  async updateConversation(conversationId: string, updates: any): Promise<void> {
    // À implémenter selon vos besoins
    throw new Error('Not implemented');
  }

  async sendMessage(userId: string, conversation: Conversation, message: Message): Promise<void> {
    console.log('📤 Début de l\'envoi du message...');
    try {
      // 1. Obtenir la configuration WhatsApp de l'utilisateur
      const whatsappConfig = await this.getWhatsAppConfig(userId);
      console.log('✅ Configuration WhatsApp récupérée:', whatsappConfig);

      // 2. Obtenir le service WhatsApp
      const whatsappService = getWhatsAppService(whatsappConfig);
      console.log('✅ Service WhatsApp initialisé');

      // Vérifier et utiliser le bon numéro de téléphone
      const phoneNumber = conversation.guestPhone || conversation.phone_number;
      if (!phoneNumber) {
        throw new Error('Numéro de téléphone du destinataire manquant');
      }
      console.log('📱 Envoi au numéro:', phoneNumber);

      // 3. Envoyer le message
      const messageId = await whatsappService.sendMessage(phoneNumber, {
        type: 'text',
        text: message.text
      });
      console.log('✅ Message envoyé avec succès, ID:', messageId);

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
        console.log('✅ Statut du message mis à jour');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();
