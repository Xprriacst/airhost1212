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
          fields: ['Name', 'Address', 'Photos']
        })
        .all();

      return records.map(mapRecordToProperty);
    } catch (error) {
      console.error('Error fetching all properties:', error);
      throw error;
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

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Récupérer toutes les propriétés
      const records = await base('Properties')
        .select({ 
          view: 'Grid view',
          fields: ['Name', 'Address', 'Photos']
        })
        .all();

      // Convertir les records en propriétés
      const properties = records.map(mapRecordToProperty);

      // Filtrer les propriétés selon les autorisations de l'utilisateur
      return await authorizationService.filterAccessibleProperties(user.id, properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  async updateProperty(id: string, propertyData: Partial<Property>): Promise<Property | null> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const user = authService.getCurrentUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Vérifier si l'utilisateur a accès à cette propriété
      const hasAccess = await authorizationService.canAccessProperty(user.id, id);
      if (!hasAccess) {
        throw new Error('Access denied to this property');
      }

      const record = await base('Properties').update(id, {
        Name: propertyData.name,
        Address: propertyData.address,
        Photos: propertyData.photos
      });

      return mapRecordToProperty(record);
    } catch (error) {
      console.error('Error updating property:', error);
      throw error;
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

      // Vérifier si l'utilisateur a accès à cette propriété
      const hasAccess = await authorizationService.canAccessProperty(user.id, id);
      if (!hasAccess) {
        throw new Error('Access denied to this property');
      }

      await base('Properties').destroy(id);
      return true;
    } catch (error) {
      console.error('Error deleting property:', error);
      throw error;
    }
  }
};