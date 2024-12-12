import type { Message, Property } from '../../types';

export const generateSystemPrompt = (property: Property): string => {
  const aiInstructions = property.aiInstructions
    ?.filter(instruction => instruction.isActive)
    .sort((a, b) => a.priority - b.priority)
    .map(instruction => {
      switch (instruction.type) {
        case 'tone':
          return `TON: ${instruction.content}`;
        case 'knowledge':
          return `INFO: ${instruction.content}`;
        case 'rules':
          return `RÈGLE: ${instruction.content}`;
      }
    })
    .join('\n');

  return `Tu es un assistant de conciergerie pour "${property.name}".

LOGEMENT:
- Nom: ${property.name}
- Adresse: ${property.address}
${property.description ? `- Description: ${property.description}` : ''}

${aiInstructions ? `INSTRUCTIONS:\n${aiInstructions}\n` : ''}

RÈGLES:
1. Réponds de manière concise et précise
2. Utilise uniquement les informations fournies
3. Si tu ne connais pas une information, dis-le simplement
4. Personnalise chaque réponse pour ce logement spécifique
5. Reste professionnel et chaleureux`;
};

export const generateUserPrompt = (
  message: Message,
  bookingContext: { hasBooking: boolean; checkIn?: string; checkOut?: string; }
): string => {
  let prompt = `Question du voyageur: "${message.text}"`;

  if (bookingContext.hasBooking && bookingContext.checkIn && bookingContext.checkOut) {
    prompt += `\nContexte: Réservation du ${bookingContext.checkIn} au ${bookingContext.checkOut}`;
  }

  return prompt;
};