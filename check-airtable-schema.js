import 'dotenv/config';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.VITE_AIRTABLE_API_KEY || process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.VITE_AIRTABLE_BASE_ID || process.env.AIRTABLE_BASE_ID;

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function checkAirtableSchema() {
  try {
    console.log('Récupération du schéma de la table Conversations...');
    
    // Récupérer la première conversation pour voir la structure
    const records = await base('Conversations').select({
      maxRecords: 1
    }).firstPage();

    if (records.length > 0) {
      const conversation = records[0];
      console.log('\nStructure de la table:');
      const fields = conversation._rawJson.fields;
      
      Object.entries(fields).forEach(([key, value]) => {
        console.log(`\nChamp: "${key}"`);
        console.log(`Type: ${typeof value}`);
        if (value !== null && value !== undefined) {
          console.log(`Exemple de valeur: ${JSON.stringify(value)}`);
        }
      });
    } else {
      // Si pas de conversation, créer une conversation de test
      console.log('\nCréation d\'une conversation de test...');
      const newConversation = await base('Conversations').create({
        '{Guest phone number}': '+33617370484',
        'Messages': JSON.stringify([]),
        'LastMessageTimestamp': new Date().toISOString()
      });
      console.log('Conversation de test créée avec ID:', newConversation.id);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
}

checkAirtableSchema();
