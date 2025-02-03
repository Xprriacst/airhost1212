import dotenv from 'dotenv';
import Airtable from 'airtable';
import { getWhatsAppService } from '../services/whatsapp';

// Charger les variables d'environnement avant tout
dotenv.config();

// Configurer Airtable directement
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID || '');

const testWhatsAppMessage = async () => {
  try {
    // Récupérer la configuration WhatsApp de l'utilisateur
    const usersTable = base('Users');
    const user = await usersTable.find('recUyjZp3LTyFwM5X');
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Créer la configuration WhatsApp
    const whatsappConfig = {
      provider: 'official' as const,
      appId: process.env.WHATSAPP_APP_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
      phoneNumberId: user.get('whatsapp_phone_number_id'),
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
