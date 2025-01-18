import { base } from '../src/services/airtable/config';

async function listUsers() {
  try {
    if (!base) {
      throw new Error('Airtable is not configured');
    }

    const records = await base('Users')
      .select({
        view: 'Grid view',
        fields: ['Email', 'Name']
      })
      .all();

    console.log('\nListe des utilisateurs :');
    console.log('--------------------');
    records.forEach(record => {
      console.log(`ID: ${record.id}`);
      console.log(`Email: ${record.get('Email')}`);
      console.log(`Name: ${record.get('Name')}`);
      console.log('--------------------');
    });
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
}

listUsers();
