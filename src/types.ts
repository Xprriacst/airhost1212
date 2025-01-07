export interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isUser?: boolean;  // Optional car remplacé par sender
  sender: 'host' | 'guest';
  type?: 'text' | 'image' | 'video' | 'audio';
  status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface Conversation {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  messages: Message[];
  properties: string[];
  autoPilot: boolean;
  unreadCount: number;
  propertyName?: string;
}

export type EmergencyTag = 
  | 'client_mecontent'
  | 'probleme_technique'
  | 'probleme_stock'
  | 'reponse_inconnue'
  | 'urgence';

export interface Property {
  id: string;
  name: string;
  aiInstructions?: {
    id: string;
    propertyId: string;
    type: string;
    content: string;
    isActive: boolean;
    priority: number;
  }[];
}
