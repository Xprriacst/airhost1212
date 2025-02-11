import Airtable from 'airtable';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

async function testWhatsAppMessage() {
  try {
    // 1. Initialisation de la connexion Airtable
    const base = new Airtable({ 
      apiKey: process.env.AIRTABLE_API_KEY 
    }).base(process.env.AIRTABLE_BASE_ID);
    
    // 2. Récupération de la configuration WhatsApp depuis Users
    const userId = 'recczcQYZdimsKVFo';
    const userRecord = await base('Users').find(userId);
    
    if (!userRecord) {
      console.error('Utilisateur non trouvé');
      return;
    }

    // Parser la configuration qui est stockée sous forme de chaîne JSON
    const whatsappConfigStr = userRecord.get('whatsapp_business_config');
    const whatsappConfig = typeof whatsappConfigStr === 'string' 
      ? JSON.parse(whatsappConfigStr)
      : whatsappConfigStr;
      
    console.log('Configuration WhatsApp récupérée:', whatsappConfig);

    // Utilisation de la bonne clé pour le token
    const accessToken = whatsappConfig?.access_token;
    if (!accessToken) {
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
    const phoneNumberId = whatsappConfig.phone_number_id || '477925252079395';
    const apiVersion = 'v21.0';
    
    console.log('Envoi de la requête avec :');
    console.log('- Phone Number ID:', phoneNumberId);
    console.log('- Token:', accessToken.substring(0, 20) + '...');
    console.log('- Payload:', JSON.stringify(payload, null, 2));
    
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
