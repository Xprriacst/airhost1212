import { getWhatsAppService } from '../services/whatsapp';
import { WhatsAppConfig } from '../types/whatsapp';

// Configuration WhatsApp
const whatsappConfig: WhatsAppConfig = {
  provider: 'official',
  appId: '1676211843267502',
  accessToken: 'EAAX0gXt8e64BO1NJ52lLQaAFb6TQ3cYOBqKVaCX9VF5ZCDiq5fVH2vO6M69gD7ZCUeu6KENhYTYjF6f3tyBfumwC9NZAOpzgrPtke9BM0WKZBhVZADIshqhCZAFt6TZCFBusHekVVrcXiZBZAdhxZBF4QI8T7FZBvL1ZAu2ougSq98Vler5yOTQdMRZC0cTsJiGlxqxG3ZAU1V3YZBWHSOZBCFIJJ8XRi8uG',
  apiVersion: 'v18.0',
  phoneNumberId: '477925252079395',
  apiUrl: 'https://graph.facebook.com/v18.0'
};

const testWhatsAppMessage = async () => {
  try {
    // Obtenir le service WhatsApp
    const whatsappService = getWhatsAppService(whatsappConfig);
    
    // Envoyer un message de test
    const phoneNumber = '+33617370484';
    const content = {
      type: 'text' as const,
      text: 'Test de message WhatsApp via API officielle 🚀'
    };

    console.log('📱 Envoi au numéro:', phoneNumber);
    console.log('📝 Contenu:', content);

    const messageId = await whatsappService.sendMessage(phoneNumber, content);

    console.log('✅ Message envoyé avec succès !');
    console.log('ID du message:', messageId);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testWhatsAppMessage().catch(console.error);
