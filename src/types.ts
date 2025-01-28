export interface Message {
  id: string;
  text: string;
  sender: 'host' | 'guest' | 'system';
  timestamp: Date;
  type?: 'text' | 'image' | 'file';
  status?: 'sent' | 'delivered' | 'read';
  metadata?: Record<string, any>;
  emergencyTags?: string[];
}

export interface Conversation {
  id: string;
  messages: Message[];
  guestName?: string;
  guestEmail?: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  autoPilot: boolean;
  emergencyTags?: string[];
}

export interface Property {
  id: string;
  name: string;
  aiInstructions: AIInstruction[];
}

export interface AIInstruction {
  id: string;
  propertyId: string;
  type: 'general' | 'check-in' | 'check-out' | 'emergency';
  content: string;
  isActive: boolean;
  priority: number;
}
