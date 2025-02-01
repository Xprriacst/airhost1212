import { MessageContent, MessageStatus, WhatsAppConfig } from '../../types/whatsapp';

export type WhatsAppProvider = 'make' | 'official';

export interface WebhookPayload {
  propertyId: string;
  message: string;
  guestPhone: string;
  webhookId: string;
}

export interface IWhatsAppService {
  sendMessage(to: string, content: MessageContent): Promise<string>;
  getMessageStatus(messageId: string): Promise<MessageStatus>;
  markMessageAsRead(messageId: string): Promise<void>;
  handleWebhook(payload: WebhookPayload): Promise<void>;
}

export interface WhatsAppServiceConfig extends WhatsAppConfig {
  provider: WhatsAppProvider;
}
