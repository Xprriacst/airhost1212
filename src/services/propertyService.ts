import { base } from './airtable/config';
import { Property, User } from '../types';
import { authorizationService } from './authorizationService';
import { handleServiceError } from '../utils/error';

const mapAirtableToProperty = (record: any): Property => ({
  id: record.id,
  name: record.get('Name') || '',
  address: record.get('Address') || '',
  description: record.get('Description') || '',
  photos: record.get('Photos') || [],
  aiInstructions: (() => {
    const instructions = record.get('AI Instructions');
    if (!instructions) return [];
    try {
      const parsed = JSON.parse(instructions);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('Failed to parse AI Instructions:', e);
      return [];
    }
  })(),
  autoPilot: record.get('Auto Pilot') || false,
});

export const propertyService = {
  async fetchAllProperties(userId: string): Promise<Property[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('Properties')
        .select({
          fields: ['Name', 'Address', 'Description', 'Photos', 'AI Instructions', 'Auto Pilot']
        })
        .all();

      const properties = records.map(mapAirtableToProperty);
      return authorizationService.filterAccessibleProperties(userId, properties);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async fetchPropertyById(userId: string, propertyId: string): Promise<Property> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
      if (!canAccess) {
        throw new Error('Unauthorized access to property');
      }

      const record = await base('Properties').find(propertyId);
      return mapAirtableToProperty(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async createProperty(userId: string, propertyData: Partial<Property>): Promise<Property> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const record = await base('Properties').create({
        Name: propertyData.name,
        Address: propertyData.address,
        Description: propertyData.description,
        Photos: propertyData.photos,
        'AI Instructions': propertyData.aiInstructions,
        'Auto Pilot': propertyData.autoPilot,
      });

      // Ajouter automatiquement l'accès à la propriété pour l'utilisateur qui l'a créée
      await base('User Properties').create({
        'User ID': userId,
        'Property ID': record.id,
        'Role': 'owner',
        'Date': new Date().toISOString(),
        'Created By': userId
      });

      return mapAirtableToProperty(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async updateProperty(userId: string, propertyId: string, propertyData: Partial<Property>): Promise<Property> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
      if (!canAccess) {
        throw new Error('Unauthorized access to update property');
      }

      const record = await base('Properties').update(propertyId, {
        Name: propertyData.name,
        Address: propertyData.address,
        Description: propertyData.description,
        Photos: propertyData.photos,
        'AI Instructions': propertyData.aiInstructions,
        'Auto Pilot': propertyData.autoPilot,
      });

      return mapAirtableToProperty(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async deleteProperty(userId: string, propertyId: string): Promise<boolean> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
      if (!canAccess) {
        throw new Error('Unauthorized access to delete property');
      }

      await base('Properties').destroy(propertyId);
      await authorizationService.removePropertyAccess(userId, propertyId);
      return true;
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  // Gestion des accès aux propriétés
  async sharePropertyAccess(userId: string, propertyId: string, targetUserId: string, role: 'manager' | 'viewer'): Promise<void> {
    try {
      const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
      if (!canAccess) {
        throw new Error('Unauthorized access to share property');
      }

      await authorizationService.addPropertyAccess(targetUserId, propertyId, role);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async revokePropertyAccess(userId: string, propertyId: string, targetUserId: string): Promise<void> {
    try {
      const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
      if (!canAccess) {
        throw new Error('Unauthorized access to revoke property access');
      }

      await authorizationService.removePropertyAccess(targetUserId, propertyId);
    } catch (error) {
      throw handleServiceError(error);
    }
  },
};
