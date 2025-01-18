import { base } from '../src/services/airtable/config';

async function createUsersTable() {
  if (!base) {
    console.error('Airtable configuration is invalid');
    return;
  }

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
    console.error('Erreur lors de la création de la table:', error);
  }
}

createUsersTable();
