import { base } from './config';
import { mockProperties } from './mockData';
import { mapRecordToProperty } from './mappers';
import { handleServiceError } from '../../utils/error';
import type { Property } from '../../types';
import { authService, authorizationService } from '..';

export const propertyService = {
  async getAllPropertiesWithoutFiltering(): Promise<Property[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const records = await base('Properties')
        .select({
          view: 'Grid view',
          fields: ['ID', 'Name', 'Address', 'Description', 'Photos', 'AI Instructions', 'Auto Pilot', 'Conversations']
        })
        .all();

      return records.map(mapRecordToProperty);
    } catch (error) {
      console.error('Error fetching all properties:', error);
      throw error;
    }
  },

  async getProperties(): Promise<Property[]> {
    try {
      const user = authService.getCurrentUser();
      if (!user) {
        console.warn('User not authenticated, returning empty properties list');
        return [];
      }

      const allProperties = await this.getAllPropertiesWithoutFiltering();
      const authorizedProperties = await Promise.all(
        allProperties.map(async (property) => {
          const hasAccess = await authorizationService.canAccessProperty(user.id, property.id);
          return hasAccess ? property : null;
        })
      );

      return authorizedProperties.filter((p): p is Property => p !== null);
    } catch (error) {
      console.error('Error fetching properties:', error);
      return handleServiceError(error, 'Property.getProperties');
    }
  },

  async fetchPropertyById(id: string): Promise<Property> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

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

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const hasAccess = await authorizationService.canAccessProperty(user.id, id);
      if (!hasAccess) {
        throw new Error('Access denied to this property');
      }

      const updateData: Record<string, any> = {};

      if (propertyData.name) updateData['Name'] = propertyData.name;
      if (propertyData.address) updateData['Address'] = propertyData.address;
      if (propertyData.description) updateData['Description'] = propertyData.description;
      if (propertyData.aiInstructions) {
        updateData['AI Instructions'] = JSON.stringify(propertyData.aiInstructions);
      }

      const record = await base('Properties').update(id, updateData);
      return mapRecordToProperty(record);
    } catch (error) {
      console.error('Error updating property:', error);
      return null;
    }
  },

  async deleteProperty(id: string): Promise<boolean> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const hasAccess = await authorizationService.canAccessProperty(user.id, id);
      if (!hasAccess) {
        throw new Error('Access denied to this property');
      }

      await base('Properties').destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      return handleServiceError(error, 'Property.deleteProperty');
    }
  }
};