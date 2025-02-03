import dotenv from 'dotenv';
import Airtable from 'airtable';
import { conversationService } from '../services/conversation/conversationService';

// Charger les variables d'environnement avant tout
dotenv.config();

// Configurer Airtable directement
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_BASE_ID || '');

const testWhatsAppMessage = async () => {
  try {
    // ID de l'utilisateur admin
    const userId = 'recUyjZp3LTyFwM5X';

    // Récupérer l'utilisateur pour vérifier la configuration
    const usersTable = base('Users');
    const user = await usersTable.find(userId);
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    console.log('📱 Configuration utilisateur:', {
      whatsapp_provider: user.get('whatsapp_provider'),
      whatsapp_phone_number_id: user.get('whatsapp_phone_number_id')
    });

    // Message de test
    const message = {
      id: `test_${Date.now()}`,
      text: 'Test de message WhatsApp via le service de conversation 🎯',
      type: 'text' as const,
      timestamp: new Date(),
      sender: 'host',
      status: 'pending',
      metadata: {}
    };

    // Conversation de test
    const conversation = {
      id: 'recDqZBbgPgBbXDRk',
      guestPhone: '+33617370484',
      propertyId: 'recXbZCZAYZCrNZAYZC',
      status: 'active'
    };

    console.log('📱 Envoi via conversation:', {
      userId,
      conversationId: conversation.id,
      phoneNumber: conversation.guestPhone
    });

    // Envoyer le message via le service de conversation
    await conversationService.sendMessage(userId, conversation, message);

    console.log('✅ Message envoyé avec succès !');
    console.log('ID de la conversation:', conversation.id);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testWhatsAppMessage().catch(console.error);
