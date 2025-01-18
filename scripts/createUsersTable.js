import Airtable from 'airtable';

// Récupérer les variables d'environnement depuis le fichier .env
const AIRTABLE_API_KEY = 'patlhfIgBrQOublx1.abb4f6845a28c05bdbb50de759bff59e27ae77c1fac38009506be9e2fe2c727a';
const AIRTABLE_BASE_ID = 'appOuR5fZOnAGiS3b';

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('Les variables d\'environnement AIRTABLE_API_KEY et AIRTABLE_BASE_ID sont requises');
  process.exit(1);
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

async function createUsersTable() {
  try {
    // Créer la table Users
    const records = await base('Users').create([
      {
        fields: {
          email: 'admin@example.com',
          password: '$2a$10$yFsD.94ts4mCpGz2pVl1euaLbIqqhRYXMnJY3l150WX2X0NLCeLqC',
          name: 'Admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
      },
    ]);

    console.log('Table Users créée avec succès !');
    console.log('Utilisateur admin créé:', records[0].getId());
    console.log('\nVous pouvez maintenant vous connecter avec :');
    console.log('Email: admin@example.com');
    console.log('Mot de passe: admin123');
  } catch (error) {
    if (error.error === 'NOT_FOUND') {
      console.error('Erreur : La table "Users" n\'existe pas. Veuillez d\'abord créer la table dans Airtable avec les champs suivants :');
      console.log('- email (Single line text)');
      console.log('- password (Single line text)');
      console.log('- name (Single line text)');
      console.log('- role (Single select avec options: admin, user)');
      console.log('- createdAt (Single line text)');
    } else {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
    }
  }
}

createUsersTable();
