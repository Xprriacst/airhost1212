import { OfficialWhatsAppService } from './src/services/whatsapp/officialService';

async function testWhatsApp() {
  const userId = 'recczcQYZdimsKVFo';
  const whatsappService = new OfficialWhatsAppService(userId);

  try {
    const messageId = await whatsappService.sendMessage('33617370484', {
      type: 'text',
      text: 'Message de test depuis le service WhatsApp',
      metadata: {
        lastMessageTimestamp: new Date()
      }
    });
    console.log('Message envoyé avec succès:', messageId);
  } catch (error) {
    console.error('Erreur lors de l envoi du message:', error);
  }
}

testWhatsApp();
