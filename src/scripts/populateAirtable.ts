
import Airtable from 'airtable';

// Securely fetching API key and Base ID
const apiKey = process.env.VITE_AIRTABLE_API_KEY || '';
const baseId = process.env.VITE_AIRTABLE_BASE_ID || '';

if (!apiKey || !baseId) {
  console.error('Airtable API key or Base ID is missing. Please check your environment variables.');
  process.exit(1);
}

const base = new Airtable({ apiKey }).base(baseId);

// Function to populate properties
async function createProperties() {
  console.log('Creating properties...');

  const properties = [
    {
      fields: {
        Name: 'Studio Blois',
        Address: '13 rue des Papegaults, Blois',
        'WiFi Name': 'FREEBOX-AE4AC6',
        'WiFi Password': 'password1234',
        'Door Code': '210',
        'House Rules': ['Max 4 personnes', 'Pas de visiteurs supplémentaires', 'Respecter le calme'],
        'Amenities': ['TV', 'Cuisine', 'Chauffage'],
        'Check-in Time': '15:00',
        'Check-out Time': '11:00',
        'Max Guests': 4,
        'Description': 'Charmant studio en plein cœur de Blois',
        'Parking Info': 'Parking gratuit : Parking du Mail (5 minutes à pied)',
        'Restaurants': ['Brute Maison de Cuisine', 'Le Diffa', "Bro's Restaurant"],
        'Fast Food': ["Frenchy's", 'Le Berliner', 'Osaka'],
        'Emergency Contacts': ['+33 6 17 37 04 84', '+33 6 20 16 93 17']
      }
    },
    {
      fields: {
        Name: 'Villa Sunset',
        Address: '123 Avenue de la Plage, Biarritz',
        'WiFi Name': 'SunsetVilla_5G',
        'WiFi Password': 'welcome2024!',
        'Door Code': '4080#',
        'House Rules': ['Pas de fête', 'Pas de fumée', 'Calme entre 22h et 8h'],
        'Amenities': ['Piscine', 'Accès plage', 'Parking gratuit'],
        'Check-in Time': '15:00',
        'Check-out Time': '11:00',
        'Max Guests': 6
      }
    }
  ];

  try {
    const createdProperties = await base('Properties').create(properties);
    console.log(`✓ ${createdProperties.length} properties created successfully.`);
    return createdProperties;
  } catch (error) {
    console.error('Error while creating properties:', error);
    process.exit(1);
  }
}

// Function to create conversations linked to properties
async function createConversations(properties) {
  console.log('Creating conversations...');

  const conversations = [
    {
      fields: {
        Property: [properties[0].id], // Studio Blois
        'Guest Name': 'Pierre Dubois',
        'Guest Email': 'pierre.dubois@email.com',
        'Check-in Date': '2024-03-10',
        'Check-out Date': '2024-03-15',
        Status: 'Confirmed',
        Messages: JSON.stringify([
          { id: '1', text: 'Bienvenue au logement !', isUser: true, sender: 'Hôte' },
          { id: '2', text: 'Merci, quel est le WiFi ?', isUser: false, sender: 'Pierre Dubois' }
        ])
      }
    },
    {
      fields: {
        Property: [properties[0].id], // Studio Blois
        'Guest Name': 'Marie Laurent',
        'Guest Email': 'marie.laurent@email.com',
        'Check-in Date': '2024-03-15',
        'Check-out Date': '2024-03-20',
        Status: 'Confirmed',
        Messages: JSON.stringify([
          { id: '1', text: 'Bonjour et bienvenue !', isUser: true, sender: 'Hôte' },
          { id: '2', text: 'Pas de drap housse.', isUser: false, sender: 'Marie Laurent' }
        ])
      }
    }
  ];

  try {
    const createdConversations = await base('Conversations').create(conversations);
    console.log(`✓ ${createdConversations.length} conversations created successfully.`);
  } catch (error) {
    console.error('Error while creating conversations:', error);
    process.exit(1);
  }
}

// Main function to populate Airtable
async function populateAirtable() {
  console.log('Starting Airtable population...');
  try {
    const properties = await createProperties();
    await createConversations(properties);
    console.log('✓ Airtable database populated successfully.');
  } catch (error) {
    console.error('Error populating Airtable:', error);
    process.exit(1);
  }
}

populateAirtable();
