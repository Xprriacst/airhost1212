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
    try {
      const conversationsTable = base('Conversations');
      const record = await conversationsTable.find(conversationId);
      
      if (!record) {
        throw new Error('Conversation non trouvée');
      }

      const messages = record.get('Messages');
      const parsedMessages = messages ? JSON.parse(messages) : [];

      return {
        id: record.id,
        propertyId: record.get('Property') as string,
        guestPhone: record.get('GuestPhone') as string,
        phone_number: record.get('GuestPhone') as string,
        messages: parsedMessages,
        guestName: record.get('GuestName') as string,
        status: record.get('Status') as string,
        createdTime: record.get('CreatedTime') as string
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la conversation:', error);
      throw error;
    }
  }

  async updateConversation(conversationId: string, updates: any): Promise<void> {
    try {
      const conversationsTable = base('Conversations');
      await conversationsTable.update(conversationId, updates);
      console.log('✅ Conversation mise à jour avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la conversation:', error);
      throw error;
    }
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

      // Vérifier et formater le numéro de téléphone
      let phoneNumber = conversation.guestPhone || conversation.phone_number;
      if (!phoneNumber) {
        throw new Error('Numéro de téléphone du destinataire manquant');
      }

      // Nettoyer le numéro de téléphone
      phoneNumber = phoneNumber.replace(/[^0-9+]/g, '');
      
      // S'assurer que le numéro commence par +
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber;
      }
      
      console.log('📱 Envoi au numéro formaté:', phoneNumber);

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
