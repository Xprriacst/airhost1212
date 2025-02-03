import dotenv from 'dotenv';
import { getWhatsAppService } from '../services/whatsapp';

// Charger les variables d'environnement avant tout
dotenv.config();

const testWhatsAppMessage = async () => {
  try {
    // Créer la configuration WhatsApp
    const whatsappConfig = {
      provider: 'official' as const,
      appId: process.env.WHATSAPP_APP_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      phoneNumberId: '477925252079395',
      apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
    };

    // Obtenir le service WhatsApp
    const whatsappService = getWhatsAppService(whatsappConfig);
    
    // Envoyer un message de test
    const phoneNumber = '+33617370484';
    const content = {
      type: 'text' as const,
      text: 'Test de message WhatsApp via API officielle 🚀'
    };

    console.log('📱 Configuration WhatsApp:', {
      provider: whatsappConfig.provider,
      phoneNumberId: whatsappConfig.phoneNumberId
    });
    console.log('📱 Envoi au numéro:', phoneNumber);

    const messageId = await whatsappService.sendMessage(phoneNumber, content);

    console.log('✅ Message envoyé avec succès !');
    console.log('ID du message:', messageId);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testWhatsAppMessage().catch(console.error);
