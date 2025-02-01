const { OfficialWhatsAppService } = require('../services/whatsapp/officialService');
const { whatsappConfig } = require('../config/whatsapp');

async function testWhatsAppMessage() {
  try {
    const whatsappService = new OfficialWhatsAppService(whatsappConfig);
    
    // Numéro de test (à remplacer par un vrai numéro)
    const testPhoneNumber = '+33617370484';
    
    // Message de test
    const message = {
      type: 'text',
      text: 'Test de l\'API WhatsApp officielle 👋',
    };

    console.log('Envoi du message de test...');
    const messageId = await whatsappService.sendMessage(testPhoneNumber, message);
    console.log('Message envoyé avec succès ! ID:', messageId);

    // Attendre quelques secondes puis vérifier le statut
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const status = await whatsappService.getMessageStatus(messageId);
    console.log('Statut du message:', status);

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testWhatsAppMessage();
