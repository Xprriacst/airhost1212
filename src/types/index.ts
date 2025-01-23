import { z } from 'zod';
import { User } from './auth';

export interface AIInstruction {
  id: string;
  propertyId: string;
  type: 'tone' | 'knowledge' | 'rules';
  content: string;
  isActive: boolean;
  priority: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export interface Property {
  id: string;
  description?: string;
  photos?: string[];
  aiInstructions?: string;
  autoPilot?: boolean;
  conversations?: string[];
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Conversation {
  id: string;
  propertyId: string;
  Properties: string | string[];
  'Guest Name'?: string;
  'Guest Email'?: string;
  'Guest phone number'?: string;
  Messages?: string;
  messages: Message[];
  'Check-in Date'?: string;
  'Check-out Date'?: string;
  'Auto Pilot'?: boolean;
  UnreadCount?: number;
}

export interface EmergencyTag {
  name: string;
  color: string;
  priority: number;
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

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface UserProperty {
  userId: string;
  propertyId: string;
  role: string;
  date?: string;
  createdBy?: string;
}