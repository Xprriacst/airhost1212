import { MessageContent, MessageStatus } from '../../types/whatsapp';
import { IWhatsAppService, WebhookPayload } from './types';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/6nnd7wwqw2srqyar2jwwtqqliyn83gda';

export class MakeWhatsAppService implements IWhatsAppService {
  constructor() {
    // Configuration spécifique à Make si nécessaire
  }

  async sendMessage(to: string, content: MessageContent): Promise<string> {
    try {
      const response = await fetch(MAKE_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: to,
          message: content.text,
          type: content.type,
          media_url: content.media_url,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur Make: ${response.statusText}`);
      }

      const data = await response.json();
      return data.messageId || '';
    } catch (error) {
      console.error('Erreur lors de l\'envoi via Make:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // Pour Make, on peut considérer que les messages sont "sent" par défaut
    return 'sent';
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    // Pas d'implémentation nécessaire pour Make
    return;
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Traitement des webhooks Make
    console.log('Message reçu via Make:', payload);
    // Logique de traitement existante...
  }
}
