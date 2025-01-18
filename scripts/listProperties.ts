import { propertyService } from '../src/services/airtable/propertyService';

async function listProperties() {
  try {
    const properties = await propertyService.getAllPropertiesWithoutFiltering();
    console.log('\nListe des propriétés :');
    console.log('--------------------');
    properties.forEach(property => {
      console.log(`ID: ${property.id}`);
      console.log(`Nom: ${property.name}`);
      console.log(`Adresse: ${property.address}`);
      console.log('--------------------');
    });
  } catch (error) {
    console.error('❌ Error listing properties:', error);
  }
}

listProperties();
