import Airtable from 'airtable';

const base = new Airtable({
  apiKey: 'patWHbXxbcFkKGqP6.d6d71ef9ba74b567d7b19a5e66b151964edb0464db8a18e91846614f2f9e44bd'
}).base('app9QXNgVWVwSwipK');

async function createTestRecord() {
  console.log('\n=== Creating Test Record in Airtable ===\n');

  try {
    const testProperty = {
      "Name": "Test Villa",
      "Address": "123 Test Street, Test City",
      "CheckIn Time": "15:00",
      "CheckOut Time": "11:00",
      "Max Guests": 4
    };

    console.log('Creating record...');
    const record = await base('Properties').create(testProperty);
    
    console.log('\n✓ Test record created successfully!');
    console.log('Record ID:', record.id);
    console.log('Fields:', record.fields);

  } catch (error) {
    console.error('\n❌ Error creating test record:', error);
    process.exit(1);
  }
}

createTestRecord();