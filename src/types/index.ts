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
  autoPilot?: boolean;
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
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  autoPilot: boolean;
  messages: Message[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}