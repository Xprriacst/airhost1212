import { OfficialWhatsAppService } from '../services/whatsapp/officialService';
import { MessageContent, WhatsAppConfig } from '../types/whatsapp';

async function testWhatsAppTemplates() {
  // Configuration WhatsApp
  const config: WhatsAppConfig = {
    provider: 'official',
    appId: '1676211843267502',
    phoneNumberId: '477925252079395',
    accessToken: 'EAAX0gXt8e64BO1S1KnbHb5Wj0yCikpeBmqu7wgq6v1sgEAA8jTXU4OVkhWIplOSFZCTuQmpjE7lAh6MF5ZBMD4IAGmffZATLZBcNVFdZAzlaGjVe0HSuTFxrZC8dFRl26KIBbZAqLNasASVRSkr4jXZCBWoFCpZAvm7xZBqAggz4Y0chuBRtfZBAZC3zVCW08m0rZA4NINLD1xwfQK5vApvXdakS79k1TDQZDZD',
    apiVersion: 'v21.0',
    apiUrl: 'https://graph.facebook.com'
  };

  const whatsappService = new OfficialWhatsAppService(config);
  const testPhoneNumber = '33617370484';

  // Test du template hello_world
  console.log('Test du template hello_world...');
  const helloWorldContent: MessageContent = {
    type: 'text',
    metadata: {
      template: 'hello_world',
      // On force le timestamp à null pour simuler un message hors fenêtre de 24h
      lastMessageTimestamp: null
    }
  };

  try {
    const messageId1 = await whatsappService.sendMessage(testPhoneNumber, helloWorldContent);
    console.log('✅ Message hello_world envoyé avec succès, ID:', messageId1);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du template hello_world:', error);
  }

  // Attendre 5 secondes entre les envois
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test du template bienvenue
  console.log('\nTest du template bienvenue...');
  const bienvenueContent: MessageContent = {
    type: 'text',
    metadata: {
      template: 'bienvenue',
      // On force le timestamp à null pour simuler un message hors fenêtre de 24h
      lastMessageTimestamp: null
    }
  };

  try {
    const messageId2 = await whatsappService.sendMessage(testPhoneNumber, bienvenueContent);
    console.log('✅ Message bienvenue envoyé avec succès, ID:', messageId2);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du template bienvenue:', error);
  }
}

// Exécuter les tests
testWhatsAppTemplates().catch(console.error);
