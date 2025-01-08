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
    const propertyContext = `
      Logement: ${context.property.name}
      Description: ${context.property.description || ''}
      Adresse: ${context.property.address || ''}
      Capacité: ${context.property.capacity || ''} personnes
      Check-in: ${context.property.checkInInstructions || ''}
      WiFi: ${context.property.wifiInformation || ''}
      Règles: ${context.property.rules || ''}
    `;

    const aiInstructions = context.property.aiInstructions
      ?.map(instruction => instruction.content)
      .join('\n\n') || '';

    return `Tu es un assistant pour un hôte Airbnb. Tu dois répondre aux questions des clients de manière professionnelle, amicale et précise.

Voici les informations du logement:
${propertyContext}

Instructions spécifiques et connaissances supplémentaires:
${aiInstructions}

Utilise ces informations pour répondre aux questions des clients. Si une question correspond à une des instructions spécifiques, utilise cette réponse en priorité. Sinon, base-toi sur les informations générales du logement.`;
  }

  static buildUserPrompt(message: Message): string {
    return `Voici les derniers messages de la conversation:\nClient: ${message.text}\n\nGénère une réponse appropriée en tant qu'hôte, en français.`;
  }
}