import axios from 'axios';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/0xd6mgmuyiwrcmd8dgop4lv08ui1zjcc';

const properties = [
  {
    name: "Studio Blois",
    address: "13 rue des Papegaults, Blois",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maxGuests: 4,
    accessCodes: {
      wifi: {
        name: "FREEBOX-AE4AC6",
        password: "barbani@%-solvi38-irrogatura-cannetum?&"
      },
      door: "210"
    },
    amenities: ["TV", "Kitchen", "Heating"],
    houseRules: ["Max 4 people", "No extra visitors", "Respect noise levels"],
    additionalInfo: {
      restaurants: ["Brute Maison de Cuisine", "Le Diffa", "Bro's Restaurant"],
      fastFood: ["Frenchy's", "Le Berliner", "Osaka"],
      parking: "Parking gratuit : Parking du Mail (5 minutes à pied)"
    }
  },
  {
    name: "Sunset Villa",
    address: "123 Ocean Drive, Miami Beach, FL",
    checkInTime: "15:00",
    checkOutTime: "11:00",
    maxGuests: 6,
    accessCodes: {
      wifi: {
        name: "SunsetVilla_5G",
        password: "welcome2024!"
      },
      door: "4080#"
    },
    amenities: ["Pool", "Beach access", "Free parking"],
    houseRules: ["No smoking", "No parties", "Quiet hours 10 PM - 8 AM"],
    additionalInfo: {
      restaurants: ["Ocean View Restaurant", "Beach Bistro", "Sunset Grill"],
      fastFood: ["Beach Burger", "Coastal Tacos", "Sandy's Subs"],
      parking: "Free parking available on premises"
    }
  }
];

async function populateProperties() {
  console.log('\n=== Starting Property Population via Make.com ===\n');

  for (const property of properties) {
    try {
      console.log(`Creating property: ${property.name}...`);
      
      const response = await axios.post(MAKE_WEBHOOK_URL, {
        action: 'create',
        property
      }, {
        timeout: 10000,
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