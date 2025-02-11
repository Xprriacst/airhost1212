import Airtable from 'airtable';
import { env } from './src/config/env';

async function testWhatsAppMessage() {
  try {
    // 1. Initialisation de la connexion Airtable
    const base = new Airtable({ apiKey: env.airtable.apiKey }).base(env.airtable.baseId);
    
    // 2. Récupération de la configuration WhatsApp depuis Users
    const userId = 'recczcQYZdimsKVFo';
    const userRecord = await base('Users').find(userId);
    
    if (!userRecord) {
      console.error('Utilisateur non trouvé');
      return;
    }

    const whatsappConfig = userRecord.get('whatsapp_business_config');
    console.log('Configuration WhatsApp récupérée:', whatsappConfig);

    if (!whatsappConfig?.access_token) {
      console.error('Token WhatsApp non trouvé dans la configuration');
      return;
    }

    // 3. Construction du payload pour l'API WhatsApp
    const payload = {
      messaging_product: "whatsapp",
      to: "33617370484",
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };

    // 4. Envoi de la requête à l'API WhatsApp
    const phoneNumberId = '477925252079395'; // ID du numéro WhatsApp Business
    const apiVersion = 'v21.0';
    
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappConfig.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log('Réponse de l\'API WhatsApp:', result);

    if (!response.ok) {
      console.error('Erreur lors de l\'envoi du message:', result);
      return;
    }

    console.log('Message envoyé avec succès!');
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

// Exécution du test
testWhatsAppMessage();
