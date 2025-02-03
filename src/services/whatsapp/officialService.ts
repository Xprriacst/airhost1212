import { MessageContent, MessageStatus, WhatsAppConfig } from '../../types/whatsapp';
import { IWhatsAppService, WebhookPayload } from './types';

export class OfficialWhatsAppService implements IWhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(to: string, content: MessageContent): Promise<string> {
    try {
      console.log('📤 Envoi de message WhatsApp (API officielle):', {
        to,
        content,
        phoneNumberId: this.config.phoneNumberId,
        apiUrl: this.config.apiUrl
      });

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: content.type,
        text: content.type === 'text' ? { body: content.text } : undefined,
      };
      console.log('📦 Payload:', JSON.stringify(payload, null, 2));

      const response = await fetch(`${this.config.apiUrl}/${this.config.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📥 Réponse brute:', responseText);

      if (!response.ok) {
        console.error('❌ Erreur API WhatsApp:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText
        });
        throw new Error(`Erreur API WhatsApp: ${response.status} ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Réponse parsée:', data);
      
      const messageId = data.messages?.[0]?.id;
      console.log('📱 Message ID:', messageId);
      
      return messageId || '';
    } catch (error) {
      console.error('Erreur lors de l\'envoi via l\'API WhatsApp:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      const response = await fetch(`${this.config.apiUrl}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du statut: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapStatus(data.status);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      await fetch(`${this.config.apiUrl}/${messageId}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Traitement des webhooks de l'API officielle
    console.log('Message reçu via l\'API officielle:', payload);
    // Implémentation du traitement des webhooks...
  }

  private mapStatus(apiStatus: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed',
    };
    return statusMap[apiStatus] || 'sent';
  }
}
