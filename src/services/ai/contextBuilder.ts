import type { AIResponseContext, BookingContext, TimeContext, ConversationContext } from './types';
import type { Property, Message } from '../../types';

export class ContextBuilder {
  private static calculateTimeContext(booking?: BookingContext): TimeContext {
    const now = new Date();
    const isNightTime = now.getHours() >= 22 || now.getHours() < 7;

    if (!booking?.checkIn || !booking?.checkOut) {
      return { currentTime: now, isNightTime };
    }

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const isCheckInDay = checkIn.toDateString() === now.toDateString();
    const isCheckOutDay = checkOut.toDateString() === now.toDateString();
    
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 3600 * 24));
    const daysUntilCheckOut = Math.ceil((checkOut.getTime() - now.getTime()) / (1000 * 3600 * 24));

    return {
      currentTime: now,
      isNightTime,
      isCheckInDay,
      isCheckOutDay,
      daysUntilCheckIn,
      daysUntilCheckOut
    };
  }

  private static buildConversationContext(messages: Message[]): ConversationContext {
    const previousMessages = [...messages];
    const lastMessage = messages[messages.length - 1];
    const lastInteraction = lastMessage ? new Date(lastMessage.timestamp) : undefined;

    return {
      previousMessages,
      lastInteraction,
      emergencyTags: [] // À implémenter : détection des tags d'urgence
    };
  }

  static buildContext(
    property: Property,
    booking: BookingContext,
    messages: Message[]
  ): AIResponseContext {
    return {
      property,
      booking,
      time: this.calculateTimeContext(booking),
      conversation: this.buildConversationContext(messages)
    };
  }
}