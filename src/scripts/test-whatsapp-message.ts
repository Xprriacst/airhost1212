import { base } from '../services/airtable/airtableClient';
import { ConversationService } from '../services/conversation/conversationService';

const testWhatsAppMessage = async () => {
  try {
    // ID de l'utilisateur à tester
    const userId = 'recUyjZp3LTyFwM5X';
    
    // Récupérer la conversation d'Andreea
    const conversationsTable = base('Conversations');
    const [conversation] = await conversationsTable.select({
      maxRecords: 1,
      filterByFormula: `AND(
        {Status} = 'active',
        {Phone Number} = '+33617374784'
      )`
    }).firstPage();

    if (!conversation) {
      throw new Error('Conversation d\'Andreea non trouvée');
    }

    // Créer un message de test
    const message = {
      id: `test_${Date.now()}`,
      text: 'Test de message WhatsApp via API officielle 🚀',
      type: 'text',
      timestamp: new Date(),
      sender: 'host',
      status: 'pending',
      metadata: {}
    };

    // Envoyer le message
    const conversationService = new ConversationService();
    await conversationService.sendMessage(userId, {
      id: conversation.id,
      guestPhone: conversation.get('Phone Number'),
      propertyId: conversation.get('Property')[0], // Ajout de propertyId qui est requis
      status: 'active'
    }, message);

    console.log('✅ Message envoyé avec succès !');
    console.log('ID de la conversation:', conversation.id);
    console.log('Numéro de téléphone:', conversation.get('Phone Number'));
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
};

testWhatsAppMessage().catch(console.error);
