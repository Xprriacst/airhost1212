import type { Message } from '../../types';

export interface BookingContext {
  hasBooking: boolean;
  checkIn?: string;
  checkOut?: string;
}

export interface AIResponseContext {
  propertyName: string;
  propertyType: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestLanguage: string;
  previousMessages: Array<{ content: string; sender: 'host' | 'guest' }>;
}

export interface AIConfig {
  language: 'fr' | 'en';
  tone: 'friendly' | 'professional';
  shouldIncludeEmoji: boolean;
}