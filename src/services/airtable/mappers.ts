import type { Property } from '../../types';

export const mapRecordToProperty = (record: any): Property => {
  const aiInstructions = record.get('AI Instructions');
  let parsedInstructions;
  
  try {
    parsedInstructions = aiInstructions ? JSON.parse(aiInstructions) : [];
  } catch (error) {
    console.warn('Failed to parse AI Instructions:', error);
    parsedInstructions = [];
  }

  return {
    id: record.id,
    name: record.get('Name') || '',
    address: record.get('Address') || '',
    description: record.get('Description') || '',
    photos: record.get('Photos') || [],
    aiInstructions: parsedInstructions,
    autoPilot: record.get('Auto Pilot') || false,
    rules: record.get('Rules') || '',
    amenities: record.get('Amenities') || [],
    restaurants: record.get('Restaurants') || [],
    fastFood: record.get('Fast Food') || [],
    wifiInformation: record.get('WiFi Information') || '',
    checkInInstructions: record.get('Check-in Instructions') || '',
    capacity: record.get('Capacity'),
    emergencyContacts: record.get('Emergency Contacts') || []
  };
};