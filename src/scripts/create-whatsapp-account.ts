import { whatsappBusinessAccountService } from '../services/whatsapp/businessAccountService';

async function createTestAccount() {
  try {
    // Remplacez ces valeurs par celles de votre utilisateur test
    const userId = 'votre_user_id';
    const phoneNumber = '+33617370484'; // Le numéro que vous avez vérifié dans Meta Business
    
    const account = await whatsappBusinessAccountService.createAccount(
      userId,
      phoneNumber,
      {
        name: "Airhost Business",
        description: "Service de conciergerie Airhost",
        address: "Votre adresse",
        email: "contact@example.com"
      }
    );

    console.log('Compte WhatsApp Business créé avec succès:', account);
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error);
  }
}

// Pour exécuter le script :
// ts-node src/scripts/create-whatsapp-account.ts
