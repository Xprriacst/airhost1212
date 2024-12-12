import Airtable from 'airtable';

// Configuration avec vos identifiants
const base = new Airtable({
  apiKey: 'patWHbXxbcFkKGqP6.d6d71ef9ba74b567d7b19a5e66b151964edb0464db8a18e91846614f2f9e44bd'
}).base('app9QXNgVWVwSwipK');

async function testAirtable() {
  console.log('\n=== Test de lecture Airtable ===\n');

  try {
    console.log('Lecture de la table Properties...\n');
    
    const records = await base('Properties').select({
      maxRecords: 10,
      view: 'Grid view'
    }).all();

    if (records.length === 0) {
      console.log('Aucune propriété trouvée dans la base.');
      return;
    }

    console.log(`✓ ${records.length} propriétés trouvées:\n`);
    
    records.forEach((record, index) => {
      console.log(`Propriété ${index + 1}:`);
      console.log('-----------------');
      console.log('Nom:', record.get('Name'));
      console.log('Adresse:', record.get('Address'));
      console.log('Check-in:', record.get('CheckIn Time'));
      console.log('Check-out:', record.get('CheckOut Time'));
      console.log('Max Guests:', record.get('Max Guests'));
      console.log('-----------------\n');
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
  }
}

testAirtable();