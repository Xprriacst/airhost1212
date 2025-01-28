import type { Message, Property } from '../../types';
import type { BookingContext, AIConfig } from './types';

export function buildPrompt(
  lastMessage: Message,
  property: Property,
  bookingContext: BookingContext,
  previousMessages: Message[],
  config: AIConfig
): string {
  const { language = 'fr', tone = 'friendly' } = config;

  // Instructions de base
  let prompt = `Tu es un assistant pour la propriété "${property.name}". `;
  prompt += `Réponds en ${language === 'fr' ? 'français' : 'anglais'} `;
  prompt += `avec un ton ${tone === 'friendly' ? 'amical' : 'formel'}. `;

  // Contexte de réservation
  if (bookingContext.hasBooking) {
    prompt += `\nContexte de réservation :
- Check-in : ${bookingContext.checkIn}
- Check-out : ${bookingContext.checkOut}
- Nombre de voyageurs : ${bookingContext.guestCount}`;
  }

  // Instructions spécifiques à la propriété
  if (property.aiInstructions?.length > 0) {
    prompt += '\n\nInstructions spécifiques :';
    property.aiInstructions
      .filter(instr => instr.isActive)
      .sort((a, b) => b.priority - a.priority)
      .forEach(instr => {
        prompt += `\n- ${instr.content}`;
      });
  }

  // Messages précédents pour le contexte
  if (previousMessages.length > 0) {
    prompt += '\n\nMessages précédents :';
    previousMessages.forEach(msg => {
      prompt += `\n${msg.sender === 'guest' ? 'Invité' : 'Hôte'} : ${msg.text}`;
    });
  }

  // Message actuel
  prompt += `\n\nMessage de l'invité : ${lastMessage.text}`;
  prompt += '\n\nRéponds de manière concise et utile.';

  return prompt;
}