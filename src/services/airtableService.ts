import Airtable from 'airtable';
import type { Property } from '../types';
import { handleServiceError } from '../utils/error';
import { env } from '../config/env';

// Initialize Airtable base only if credentials are available
const initializeAirtableBase = () => {
  if (!env.airtable.apiKey || !env.airtable.baseId) {
    return null;
  }
  return new Airtable({ apiKey: env.airtable.apiKey }).base(env.airtable.baseId);
};

const base = initializeAirtableBase();

// Map Airtable records to Property objects
const mapRecordToProperty = (record: any): Property => ({
  id: record.id,
  name: record.get('Name') || '',
  address: record.get('Address') || '',
  accessCodes: {
    wifi: {
      name: record.get('WiFi Name') || '',
      password: record.get('WiFi Password') || ''
    },
    door: record.get('Door Code') || ''
  },
  houseRules: record.get('House Rules') || [],
  amenities: record.get('Amenities') || [],
  checkInTime: record.get('Check-in Time') || '',
  checkOutTime: record.get('Check-out Time') || '',
  maxGuests: record.get('Max Guests') || 0,
  photos: record.get('Photos') || [],
  description: record.get('Description') || '',
  parkingInfo: record.get('Parking Info') || '',
  restaurants: record.get('Restaurants') || [],
  fastFood: record.get('Fast Food') || [],
  emergencyContacts: record.get('Emergency Contacts') || []
});

export const airtableService = {
  async getProperties(): Promise<Property[]> {
    try {
      if (!base) {
        console.warn('Airtable is not configured. Using mock data.');
        return [
          {
            id: '1',
            name: 'Demo Property',
            address: '123 Demo Street',
            accessCodes: {
              wifi: {
                name: 'Demo_WiFi',
                password: 'demo123'
              },
              door: '1234'
            },
            houseRules: ['No smoking', 'No parties'],
            amenities: ['WiFi', 'Kitchen'],
            checkInTime: '15:00',
            checkOutTime: '11:00',
            maxGuests: 4,
            photos: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6'],
            description: 'A demo property for development',
            restaurants: [],
            fastFood: [],
            emergencyContacts: []
          }
        ];
      }

      console.log('Fetching properties from Airtable...');
      const records = await base('Properties')
        .select({ view: 'Grid view' })
        .all();
      return records.map(mapRecordToProperty);
    } catch (error) {
      console.error('Error fetching properties from Airtable:', error);
      return handleServiceError(error, 'Airtable.getProperties');
    }
  },

  async addProperty(propertyData: Record<string, any>): Promise<Property | null> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      console.log('Adding a property to Airtable...');
      const createdRecord = await base('Properties').create(propertyData);
      return mapRecordToProperty(createdRecord);
    } catch (error) {
      console.error('Error adding property to Airtable:', error);
      return handleServiceError(error, 'Airtable.addProperty');
    }
  },

  async deleteProperty(id: string): Promise<{ success: boolean }> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      console.log(`Deleting property with ID: ${id}`);
      await base('Properties').destroy(id);
      return { success: true };
    } catch (error) {
      console.error('Error deleting property from Airtable:', error);
      return handleServiceError(error, 'Airtable.deleteProperty');
    }
  }
};