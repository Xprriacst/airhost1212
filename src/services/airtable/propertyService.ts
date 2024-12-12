import { base } from './config';
import { mockProperties } from './mockData';
import { mapRecordToProperty } from './mappers';
import { handleServiceError } from '../../utils/error';
import type { Property } from '../../types';

export const propertyService = {
  async getProperties(): Promise<Property[]> {
    try {
      if (!base) {
        console.warn('Airtable is not configured. Using mock data.');
        return mockProperties;
      }

      const records = await base('Properties')
        .select({ 
          view: 'Grid view',
          fields: [
            'Name',
            'Address',
            'Description',
            'Photos',
            'AI Instructions'
          ]
        })
        .all();
      
      return records.map(mapRecordToProperty);
    } catch (error) {
      console.error('Error fetching properties:', error);
      return handleServiceError(error, 'Property.getProperties');
    }
  },

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      console.log('Updating property with data:', propertyData);

      const updateData: Record<string, any> = {};

      if (propertyData.name) updateData['Name'] = propertyData.name;
      if (propertyData.address) updateData['Address'] = propertyData.address;
      if (propertyData.description) updateData['Description'] = propertyData.description;
      if (propertyData.aiInstructions) {
        updateData['AI Instructions'] = JSON.stringify(propertyData.aiInstructions);
      }

      console.log('Sending update to Airtable:', updateData);

      const updatedRecord = await base('Properties').update(id, updateData);
      console.log('Property updated successfully:', updatedRecord.id);
      
      return mapRecordToProperty(updatedRecord);
    } catch (error) {
      console.error('Error updating property:', error);
      return handleServiceError(error, 'Property.updateProperty');
    }
  },

  async deleteProperty(id: string): Promise<boolean> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      await base('Properties').destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return handleServiceError(error, 'Property.deleteProperty');
    }
  }
};