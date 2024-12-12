import type { AIResponseContext, AIConfig } from './types';
import type { Message } from '../../types';

export class PromptBuilder {
  private static formatTimeContext(context: AIResponseContext): string {
    const { time } = context;
    const timeContexts = [];

    if (time.isNightTime) {
      timeContexts.push("CONTEXTE: Il est actuellement tard dans la nuit.");
    }

    if (time.isCheckInDay) {
      timeContexts.push("CONTEXTE: C'est le jour du check-in.");
    }

    if (time.isCheckOutDay) {
      timeContexts.push("CONTEXTE: C'est le jour du check-out.");
    }

    if (time.daysUntilCheckIn && time.daysUntilCheckIn > 0) {
      timeContexts.push(`CONTEXTE: Le check-in est dans ${time.daysUntilCheckIn} jours.`);
    }

    return timeContexts.join('\n');
  }

  private static formatBookingContext(context: AIResponseContext): string {
    const { booking } = context;
    if (!booking.hasBooking) {
      return "CONTEXTE: Pas de réservation active.";
    }

    return `CONTEXTE RÉSERVATION:
- Check-in: ${booking.checkIn}
- Check-out: ${booking.checkOut}
- Nombre d'invités: ${booking.guestCount || 'Non spécifié'}
${booking.specialRequests?.length ? `- Demandes spéciales: ${booking.specialRequests.join(', ')}` : ''}`;
  }

  private static formatPropertyContext(context: AIResponseContext): string {
    const { property } = context;
    return `LOGEMENT "${property.name}":
- Adresse: ${property.address}
${property.description ? `- Description: ${property.description}` : ''}

INSTRUCTIONS:
${property.aiInstructions?.map(instruction => {
  switch (instruction.type) {
    case 'tone': return `TON: ${instruction.content}`;
    case 'knowledge': return `INFO: ${instruction.content}`;
    case 'rules': return `RÈGLE: ${instruction.content}`;
  }
}).join('\n') || 'Aucune instruction spécifique définie.'}`;
  }

  private static formatConversationHistory(context: AIResponseContext): string {
    const { conversation } = context;
    if (!conversation.previousMessages.length) {
      return "HISTORIQUE: Première interaction avec l'invité.";
    }

    return `HISTORIQUE DE CONVERSATION:
${conversation.previousMessages.map(msg => 
  `${msg.sender} (${new Date(msg.timestamp).toLocaleTimeString()}): ${msg.text}`
).join('\n')}`;
  }

  static buildSystemPrompt(context: AIResponseContext, config: AIConfig = {}): string {
    return `${this.formatPropertyContext(context)}

${this.formatTimeContext(context)}

${this.formatBookingContext(context)}

${this.formatConversationHistory(context)}

CONFIGURATION:
- Langue: ${config.language || 'fr'}
- Ton: ${config.tone || 'friendly'}
- Style: ${config.shouldIncludeEmoji ? 'Inclure des emojis appropriés' : 'Sans emoji'}

DIRECTIVES:
1. Répondez de manière concise et précise
2. Adaptez le ton selon les instructions du logement
3. Utilisez le contexte temporel pour personnaliser la réponse
4. Évitez de répéter les informations déjà fournies
5. Restez professionnel et bienveillant`;
  }

  static buildUserPrompt(message: Message): string {
    return `Message de l'invité: "${message.text}"`;
  }
}