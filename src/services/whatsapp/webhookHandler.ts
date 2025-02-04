import { formatPhoneNumber } from './utils';
import { whatsappConfig, WhatsAppUserConfig } from '../../config/whatsapp';
import { userService } from '../airtable/userService';

interface WebhookVerification {
  mode: string;
  challenge: string;
  token: string;
}

interface WhatsAppMessage {
  from: string;
  text?: { body: string };
  timestamp: string;
  type: string;
  id: string;
  image?: {
    mime_type: string;
    sha256: string;
    id: string;
  };
}

interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp: string;
  recipient_id: string;
}

interface WebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

interface WebhookChange {
  value: WebhookValue;
  field: string;
}

interface WebhookEntry {
  id: string;
  changes: WebhookChange[];
}

interface WebhookData {
  object: string;
  entry: WebhookEntry[];
}

interface ConversationService {
  createOrUpdateConversation: (data: any) => Promise<void>;
  findConversationByPhone: (phone: string) => Promise<any>;
  getUserIdByPhoneNumberId: (phoneNumberId: string) => Promise<string | null>;
  // TODO: Ajouter updateMessageStatus quand implémenté
  // updateMessageStatus: (messageId: string, status: string) => Promise<void>;
}

export class WebhookHandler {
  constructor(private conversationService: ConversationService) {}

  private async getUserConfig(phoneNumberId: string): Promise<WhatsAppUserConfig | null> {
    const userId = await this.conversationService.getUserIdByPhoneNumberId(phoneNumberId);
    if (!userId) return null;
    return await userService.getWhatsAppConfig(userId);
  }

  async handleOfficialWebhook(data: WebhookData): Promise<void> {
    if (data.object !== 'whatsapp_business_account') {
      console.warn('Type d\'objet webhook non supporté:', data.object);
      return;
    }

    for (const entry of data.entry) {
      const userConfig = await this.getUserConfig(entry.id);
      if (!userConfig) {
        console.warn('Configuration WhatsApp non trouvée pour le numéro:', entry.id);
        continue;
      }

      for (const change of entry.changes) {
        const value = change.value;

        // Traitement des messages
        if (value.messages?.length) {
          for (const message of value.messages) {
            await this.handleMessage(message, entry);
          }
        }

        // Traitement des statuts
        if (value.statuses?.length) {
          for (const status of value.statuses) {
            await this.handleStatus(status);
          }
        }
      }
    }
  }

  private async handleMessage(message: WhatsAppMessage, entry: WebhookEntry): Promise<void> {
    if (message.type !== 'text' || !message.text) {
      console.log(`Type de message non supporté: ${message.type}`);
      return;
    }

    const userId = await this.conversationService.getUserIdByPhoneNumberId(entry.id);
    if (!userId) {
      console.error(`Aucun utilisateur trouvé pour le phoneNumberId: ${entry.id}`);
      return;
    }

    const messageData = {
      guestPhone: formatPhoneNumber(message.from),
      message: message.text.body,
      platform: 'whatsapp',
      waMessageId: message.id,
      timestamp: new Date(parseInt(message.timestamp) * 1000).toISOString(),
      userId: userId
    };

    try {
      await this.conversationService.createOrUpdateConversation(messageData);
      console.log('✅ Message traité avec succès:', message.id);
    } catch (error) {
      console.error('❌ Erreur lors du traitement du message:', error);
      throw error;
    }
  }

  private async handleStatus(status: WhatsAppStatus): Promise<void> {
    // TODO: Implémenter la mise à jour des statuts
    console.log('📝 Mise à jour de statut reçue:', {
      messageId: status.id,
      status: status.status,
      timestamp: status.timestamp
    });
  }

  async verifyWebhook(data: WebhookVerification): Promise<{ isValid: boolean; challenge: string | null }> {
    const verifyToken = whatsappConfig.verifyToken;
    if (
      data.mode === 'subscribe' &&
      data.token === verifyToken
    ) {
      return {
        isValid: true,
        challenge: data.challenge
      };
    }
    return {
      isValid: false,
      challenge: null
    };
  }
}
