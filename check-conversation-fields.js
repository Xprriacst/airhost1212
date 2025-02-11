import 'dotenv/config';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function checkConversationFields() {
  try {
    console.log('Recherche de la conversation...');
    const records = await base('Conversations')
      .select({
        filterByFormula: `"{Guest phone number}" = '+33617370484'`
      })
      .firstPage();

    if (records.length > 0) {
      const conversation = records[0];
      console.log('\nChamps de la conversation:');
      const fields = conversation._rawJson.fields;
      Object.keys(fields).forEach(field => {
        console.log(`- ${field}`);
      });
    } else {
      console.log('Aucune conversation trouvée');
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkConversationFields();
