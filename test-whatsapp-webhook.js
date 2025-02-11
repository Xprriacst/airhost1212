import 'dotenv/config';
import fetch from 'node-fetch';

// Simulation d'un message WhatsApp entrant
const webhookPayload = {
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "461138110424411",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "+1 555 140 0493",
          "phone_number_id": "477925252079395"
        },
        "contacts": [{
          "profile": {
            "name": "Andrea"
          },
          "wa_id": "+33617370484"
        }],
        "messages": [{
          "from": "+33617370484",
          "id": "wamid.test123",
          "timestamp": Math.floor(Date.now() / 1000),
          "text": {
            "body": "Bonjour, ceci est un message de test"
          },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
};

// URL de votre webhook Netlify
const webhookUrl = 'https://whimsical-beignet-91329f.netlify.app/.netlify/functions/whatsapp-webhook';

async function testWebhook() {
  try {
    console.log('Envoi du payload au webhook...');
    console.log('Payload:', JSON.stringify(webhookPayload, null, 2));

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature': process.env.WHATSAPP_VERIFY_TOKEN || 'airhost_whatsapp_webhook_123'
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseText = await response.text();
    console.log('Statut de la réponse:', response.status);
    console.log('Réponse:', responseText);

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
    }

    console.log('Test du webhook réussi !');
  } catch (error) {
    console.error('Erreur lors du test du webhook:', error);
  }
}

// Exécuter le test
testWebhook();
