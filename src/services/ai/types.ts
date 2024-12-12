import type { Message, Property } from '../../types';

export interface BookingContext {
  hasBooking: boolean;
  checkIn?: string;
  checkOut?: string;
  guestCount?: number;
  specialRequests?: string[];
}

export interface TimeContext {
  currentTime: Date;
  isNightTime: boolean; // Entre 22h et 7h
  isCheckInDay: boolean;
  isCheckOutDay: boolean;
  daysUntilCheckIn?: number;
  daysUntilCheckOut?: number;
}

export interface ConversationContext {
  previousMessages: Message[];
  lastInteraction?: Date;
  emergencyTags?: string[];
}

export interface AIResponseContext {
  property: Property;
  booking: BookingContext;
  time: TimeContext;
  conversation: ConversationContext;
}

export interface AIConfig {
  maxResponseLength?: number;
  language?: 'fr' | 'en';
  tone?: 'formal' | 'casual' | 'friendly';
  shouldIncludeEmoji?: boolean;
}