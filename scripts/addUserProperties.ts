import { userPropertiesService } from '../src/services/airtable/userPropertiesService';

async function addUserProperties() {
  try {
    // Ajouter des propriétés pour test@gmail.com (rec6yMSa4iz0IUAuv)
    await userPropertiesService.addUserProperty(
      'rec6yMSa4iz0IUAuv', // ID de test@gmail.com
      'recYour1stPropertyId', // Remplacer par l'ID de la première propriété
      'manager'
    );

    await userPropertiesService.addUserProperty(
      'rec6yMSa4iz0IUAuv', // ID de test@gmail.com
      'recYour2ndPropertyId', // Remplacer par l'ID de la deuxième propriété
      'viewer'
    );

    // Ajouter des propriétés pour admin@example.com (recUyjZp3LTyFwM5X)
    await userPropertiesService.addUserProperty(
      'recUyjZp3LTyFwM5X', // ID de admin@example.com
      'recYour1stPropertyId', // Remplacer par l'ID de la première propriété
      'owner'
    );

    console.log('✅ User properties added successfully');
  } catch (error) {
    console.error('❌ Error adding user properties:', error);
  }
}

addUserProperties();
