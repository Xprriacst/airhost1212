import OpenAI from 'openai';
import type { Message, Property } from '../types';
import { handleServiceError } from '../utils/error';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

const generateSystemPrompt = (property: Property): string => {
  return `Vous êtes un assistant de gestion immobilière pour ${property.name}.
Détails de la propriété :
- Adresse : ${property.address}
- Check-in : ${property.checkInTime}
- Check-out : ${property.checkOutTime}
- Capacité max : ${property.maxGuests} personnes

Fournissez des réponses concises et amicales aux questions des voyageurs. Soyez professionnel et accueillant.`;
};

export const aiService = {
  async generateResponse(
    message: Message, 
    property: Property,
    bookingContext: { hasBooking: boolean; checkIn?: string; checkOut?: string; } = { hasBooking: false }
  ): Promise<string> {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-0125-preview",
        messages: [
          { 
            role: "system", 
            content: generateSystemPrompt(property)
          },
          {
            role: "user",
            content: `Message du voyageur : "${message.text}"\n\nFournissez une réponse utile en tant que gestionnaire de la propriété.`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      return completion.choices[0]?.message?.content || "Je m'excuse, je n'ai pas pu générer une réponse pour le moment. Veuillez réessayer.";
    } catch (error) {
      return handleServiceError(error, 'OpenAI.generateResponse');
    }
  }
};