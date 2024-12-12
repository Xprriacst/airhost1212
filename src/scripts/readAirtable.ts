import Airtable from 'airtable';

// Configuration Airtable
const base = new Airtable({
  apiKey: 'patWHbXxbcFkKGqP6.d6d71ef9ba74b567d7b19a5e66b151964edb0464db8a18e91846614f2f9e44bd'
}).base('app9QXNgVWVwSwipK');

async function readProperties() {
  console.log('\n=== Lecture des propriétés dans Airtable ===\n');

  try {
    // Récupérer tous les enregistrements de la table Properties
    const records = await base('Properties').select({
      view: 'Grid view' // Vue par défaut
    }).all();

    console.log(`✓ ${records.length} propriétés trouvées:\n`);

    // Afficher chaque propriété de manière formatée
    records.forEach((record, index) => {
      console.log(`Propriété ${index + 1}:`);
      console.log('------------------');
      console.log(`Nom: ${record.get('Name')}`);
      console.log(`Adresse: ${record.get('Address')}`);
      console.log(`Check-in: ${record.get('CheckIn Time')}`);
      console.log(`Check-out: ${record.get('CheckOut Time')}`);
      console.log(`Capacité max: ${record.get('Max Guests')} personnes`);
      console.log('------------------\n');
    });

  } catch (error) {
    console.error('❌ Erreur lors de la lecture des données:', error);
    process.exit(1);
  }
}

// Exécuter la fonction
readProperties();