import 'dotenv/config';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function checkConversationMessages() {
  try {
    console.log('Recherche de la conversation pour +33617370484...');
    const records = await base('Conversations')
      .select({
        filterByFormula: `"{Guest phone number}" = '+33617370484'`
      })
      .firstPage();

    if (records.length > 0) {
      const conversation = records[0];
      console.log('\nDétails de la conversation:');
      console.log('ID:', conversation.getId());
      console.log('Numéro:', conversation.get('Guest phone number'));
      console.log('LastMessageTimestamp:', conversation.get('LastMessageTimestamp'));
      
      const messages = JSON.parse(conversation.get('Messages') || '[]');
      console.log('\nMessages:');
      messages.forEach((msg, index) => {
        console.log(`\nMessage ${index + 1}:`);
        console.log('- ID:', msg.id);
        console.log('- Type:', msg.type);
        console.log('- Contenu:', msg.content);
        console.log('- Timestamp:', msg.timestamp);
        console.log('- Direction:', msg.direction);
        console.log('- Status:', msg.status);
      });
    } else {
      console.log('Aucune conversation trouvée pour ce numéro');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkConversationMessages();
