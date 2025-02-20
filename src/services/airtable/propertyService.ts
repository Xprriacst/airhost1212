import { base } from './config';
import { Property, User } from '../../types';
import { authorizationService } from '../authorizationService';
import { handleServiceError } from '../../utils/error';

const mapAirtableToProperty = (record: any): Property => {
  const rawInstructions = record.get('AI Instructions');
  console.log('[DEBUG] Instructions AI brutes:', rawInstructions);
  
  let parsedInstructions = [];
  if (rawInstructions) {
    if (typeof rawInstructions === 'string') {
      try {
        parsedInstructions = JSON.parse(rawInstructions);
        console.log('[DEBUG] Instructions AI parsées:', parsedInstructions);
      } catch (e) {
        console.warn('[DEBUG] Erreur parsing instructions:', e);
      }
    } else {
      parsedInstructions = rawInstructions;
      console.log('[DEBUG] Instructions AI déjà parsées:', parsedInstructions);
    }
  }

  return {
  id: record.id,
  name: record.get('Name') || '',
  address: record.get('Address') || '',
  description: record.get('Description') || '',
  photos: record.get('Photos') || [],
  aiInstructions: parsedInstructions,
  autoPilot: record.get('Auto Pilot') || false,
  };
};

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
      
      console.log('[DEBUG] Données Airtable brutes:', {
        id: record.id,
        name: record.get('Name'),
        aiInstructions: record.get('AI Instructions')
      });
      
      return mapAirtableToProperty(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async createProperty(userId: string, propertyData: Partial<Property>): Promise<Property> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      // Préparer les données pour Airtable
      const createData: any = {
        Name: propertyData.name,
        Address: propertyData.address,
        Description: propertyData.description,
        Photos: propertyData.photos,
        'Auto Pilot': propertyData.autoPilot,
      };

      // Sérialiser les instructions AI en JSON si présentes
      if (propertyData.aiInstructions) {
        createData['AI Instructions'] = JSON.stringify(propertyData.aiInstructions);
      }

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

      // Préparer les données pour Airtable
      const updateData: any = {};
      
      if (propertyData.name !== undefined) updateData.Name = propertyData.name;
      if (propertyData.address !== undefined) updateData.Address = propertyData.address;
      if (propertyData.description !== undefined) updateData.Description = propertyData.description;
      if (propertyData.photos !== undefined) updateData.Photos = propertyData.photos;
      if (propertyData.autoPilot !== undefined) updateData['Auto Pilot'] = propertyData.autoPilot;
      
      // Gérer les instructions AI
      if (propertyData.aiInstructions !== undefined) {
        // Si c'est déjà une chaîne JSON, on l'utilise directement
        if (typeof propertyData.aiInstructions === 'string') {
          updateData['AI Instructions'] = propertyData.aiInstructions;
        } else {
          // Sinon on sérialise en JSON
          updateData['AI Instructions'] = JSON.stringify(propertyData.aiInstructions);
        }
        console.log('[DEBUG] Mise à jour instructions AI:', updateData['AI Instructions']);
      }

      console.log('[DEBUG] Mise à jour propriété:', {
        propertyId,
        updateData
      });

      const record = await base('Properties').update(propertyId, updateData);

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
