import { z } from 'zod';

export interface AIInstruction {
  id: string;
  propertyId: string;
  type: 'tone' | 'knowledge' | 'rules';
  content: string;
  isActive: boolean;
  priority: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  photos: string[];
  aiInstructions?: AIInstruction[];
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sender: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  messages: Message[];
}