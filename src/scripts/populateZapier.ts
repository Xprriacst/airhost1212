import axios from 'axios';

const ZAPIER_WEBHOOK_URL = 'https://hooks.zapier.com/hooks/catch/4877616/2iuc8qv/';

const properties = [
  {
    name: "Studio Blois",
    address: "13 rue des Papegaults, Blois",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maxGuests: 4,
    wifiName: "FREEBOX-AE4AC6",
    wifiPassword: "barbani@%-solvi38-irrogatura-cannetum?&",
    doorCode: "210",
    restaurants: "Brute Maison de Cuisine, Le Diffa, Bro's Restaurant",
    fastFood: "Frenchy's, Le Berliner, Osaka",
    parkingInfo: "Parking gratuit : Parking du Mail (5 minutes à pied)"
  },
  {
    name: "Sunset Villa",
    address: "123 Ocean Drive, Miami Beach, FL",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maxGuests: 6,
    wifiName: "SunsetVilla_5G",
    wifiPassword: "welcome2024!",
    doorCode: "4080#",
    restaurants: "Ocean View Restaurant, Beach Bistro, Sunset Grill",
    fastFood: "Beach Burger, Coastal Tacos, Sandy's Subs",
    parkingInfo: "Free parking available on premises"
  }
];

async function populateProperties() {
  console.log('\n=== Starting Property Population via Zapier ===\n');

  for (const property of properties) {
    try {
      console.log(`Creating property: ${property.name}...`);
      
      const response = await axios.post(ZAPIER_WEBHOOK_URL, property, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✓ Created property: ${property.name}`);
      console.log('Response:', response.data);
      console.log('---');
    } catch (error: any) {
      console.error(`\n❌ Error creating property ${property.name}:`, error.message);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      }
      process.exit(1);
    }
  }

  console.log('\n✓ All properties created successfully!');
}

populateProperties();