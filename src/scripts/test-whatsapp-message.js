import fetch from 'node-fetch';

async function checkToken(accessToken) {
  try {
    const response = await fetch('https://graph.facebook.com/v18.0/debug_token?input_token=' + accessToken, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    console.log('Informations du token:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    return null;
  }
}

async function testWhatsAppMessage() {
  try {
    const phoneNumberId = '477925252079395';
    const phoneNumber = '+33617370484';
    const message = {
      from: phoneNumberId,
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: { 
        body: 'Test de l\'API WhatsApp officielle 👋'
      }
    };


    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';

    // Vérifier le token d'abord
    await checkToken(accessToken);

    console.log('Envoi du message de test...');
    console.log('URL:', `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`);
    
    const response = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${JSON.stringify(data)}`);
    }

    console.log('Message envoyé avec succès !');
    console.log('Réponse:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testWhatsAppMessage();
