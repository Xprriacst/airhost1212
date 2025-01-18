import { base } from './config';
import { mockProperties } from './mockData';
import { mapRecordToProperty } from './mappers';
import { handleServiceError } from '../../utils/error';
import type { Property } from '../../types';
import { authorizationService } from '../authorizationService';
import { getUser } from '../../utils/auth';

export const propertyService = {
  async fetchPropertyById(id: string): Promise<Property> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const user = getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Vérifier si l'utilisateur a accès à cette propriété
      const hasAccess = await authorizationService.canAccessProperty(user.id, id);
      if (!hasAccess) {
        throw new Error('Access denied to this property');
      }

      const record = await base('Properties').find(id);
      return mapRecordToProperty(record);
    } catch (error) {
      console.error('Error fetching property:', error);
      throw error;
    }
  },

  async getProperties(): Promise<Property[]> {
    try {
      if (!base) {
        console.warn('Airtable is not configured. Using mock data.');
        return mockProperties;
      }

      const user = getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const records = await base('Properties')
        .select({ 
          view: 'Grid view',
          fields: [
            'Name',
            'Address',
            'Description',
            'Photos',
            'AI Instructions',
            'Auto Pilot'
          ]
        })
        .all();
      
      const properties = records.map(mapRecordToProperty);
      
      // Filtrer les propriétés selon les droits d'accès de l'utilisateur
      return await authorizationService.filterAccessibleProperties(user.id, properties);
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

      const user = getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Vérifier si l'utilisateur a le droit de modifier cette propriété
      const role = await authorizationService.getUserRole(user.id, id);
      if (!role || !['owner', 'manager'].includes(role)) {
        throw new Error('You do not have permission to update this property');
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

      const user = getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Vérifier si l'utilisateur a le droit de supprimer cette propriété
      const role = await authorizationService.getUserRole(user.id, id);
      if (role !== 'owner') {
        throw new Error('Only property owners can delete properties');
      }

      await base('Properties').destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return handleServiceError(error, 'Property.deleteProperty');
    }
  }
};