export type WhatsAppStatus = 'active' | 'pending' | 'suspended';
export type MessageDirection = 'inbound' | 'outbound';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'image' | 'document' | 'location';

export interface BusinessHour {
  day: number; // 0-6, 0 = Sunday
  start: string; // Format: "HH:mm"
  end: string; // Format: "HH:mm"
}

export interface WhatsAppSettings {
  notification_email: string;
  auto_reply: boolean;
  business_hours: BusinessHour[];
}

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number: string;
  phoneNumberId: string;
  waba_id: string;
  webhook_url: string;
  api_key: string;
  created_at: string;
  updated_at: string;
  status: WhatsAppStatus;
  settings: WhatsAppSettings;
}

export interface MessageContent {
  type: MessageType;
  text?: string;
  media_url?: string;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  wa_message_id: string;
  direction: MessageDirection;
  status: MessageStatus;
  content: MessageContent;
  timestamp: string;
  retry_count: number;
  error?: string;
}

// Étendre l'interface User existante
declare module './auth' {
  interface User {
    whatsapp_config?: {
      provider: WhatsAppProvider;
      phone_number: string;
      waba_id: string;
      api_key: string;
    };
    status?: WhatsAppStatus;
    whatsapp_provider?: WhatsAppProvider; // Champ pour le choix du provider
  }
}
