import OpenAI from 'openai';
import { EmergencyCase } from '../types';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

export class EmergencyDetectionService {
  private emergencyCases: EmergencyCase[];

  constructor(emergencyCases: EmergencyCase[]) {
    this.emergencyCases = emergencyCases;
  }

  async analyzeMessage(message: string): Promise<EmergencyCase | null> {
    try {
      // Créer un prompt qui décrit tous les cas d'urgence
      const emergencyCasesDescription = this.emergencyCases
        .map(ec => `${ec.name}: ${ec.description}`)
        .join('\n');

      // Appeler l'API OpenAI pour analyser le message
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es un système d'analyse de messages pour une application de gestion de locations de vacances.
            
Voici la liste des cas d'urgence définis :
${emergencyCasesDescription}

Ton rôle est d'analyser un message et de déterminer s'il correspond à l'un de ces cas d'urgence.
Si c'est le cas, retourne UNIQUEMENT l'ID du cas d'urgence correspondant.
Si ce n'est pas le cas, retourne UNIQUEMENT "NONE".

Exemples:
- Message: "Le chauffage ne fonctionne pas et il fait très froid"
  Réponse: "4" (car c'est un appareil en panne)
- Message: "Quelle est l'adresse du logement ?"
  Réponse: "NONE" (car ce n'est pas un cas d'urgence)
- Message: "Je ne peux pas ouvrir la porte avec le code"
  Réponse: "3" (car impossible d'accéder au logement)
`
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0,
        max_tokens: 10
      });

      const response = completion.choices[0].message.content?.trim();

      // Si la réponse est "NONE", ce n'est pas un cas d'urgence
      if (response === "NONE") {
        return null;
      }

      // Sinon, chercher le cas d'urgence correspondant à l'ID
      const emergencyCase = this.emergencyCases.find(ec => ec.id === response);
      return emergencyCase || null;

    } catch (error) {
      console.error('Error analyzing message for emergency:', error);
      return null;
    }
  }
}
