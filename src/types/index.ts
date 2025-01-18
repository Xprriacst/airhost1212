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

export interface Property {
  id: string;
  name: string;
  address: string;
  description?: string;
  photos?: string[];
  aiInstructions?: string;
  autoPilot?: boolean;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export interface Conversation {
  id: string;
  fields: {
    PropertyId?: string;
    UserId?: string;
    Message?: string;
    CreatedAt?: string;
    Properties?: string[];
    'Guest Name'?: string;
    'Guest Email'?: string;
    'Guest phone number'?: string;
    Messages?: string;
    'Check-in Date'?: string;
    'Check-out Date'?: string;
    'Auto Pilot'?: boolean;
    UnreadCount?: number;
  };
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

export interface RegisterCredentials extends LoginCredentials {
  name: string;
}