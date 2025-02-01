import { base } from '../../services/airtable/airtableClient';

export async function addWhatsAppProviderField() {
  try {
    // Ajouter le champ provider à la table Users
    await base('Users').updateRecords([
      {
        id: 'recxxxxxxxxxx', // ID du champ à mettre à jour
        fields: {
          whatsapp_provider: 'make' // Valeur par défaut
        }
      }
    ]);

    console.log('Migration réussie : Champ whatsapp_provider ajouté');
  } catch (error) {
    console.error('Erreur lors de la migration :', error);
    throw error;
  }
}

// Pour exécuter la migration :
// addWhatsAppProviderField().catch(console.error);
