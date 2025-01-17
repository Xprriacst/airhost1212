export interface Message {
  id: string;
  conversationId: string;
  content: string;
  timestamp: Date;
  sender: 'guest' | 'host';
  type?: 'text' | 'image' | 'file';
  status?: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  propertyId: string;
  propertyName: string;
  propertyType: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  messages: Message[];
  unreadCount?: number;
  lastMessage?: Message;
}

export type EmergencyTag = 'urgent' | 'maintenance' | 'security' | 'health';

export interface AIConfig {
  language: 'fr' | 'en';
  tone: 'friendly' | 'professional';
  shouldIncludeEmoji?: boolean;
}

export interface AIResponseContext {
  propertyName: string;
  propertyType: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  previousMessages: Message[];
}

export interface BookingContext {
  propertyId: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  numberOfGuests?: number;
}
