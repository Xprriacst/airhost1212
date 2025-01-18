import { base } from '../airtable/config';
import type { Property, Conversation } from '../../types';

export const authorizationService = {
  async getUserPropertyRole(userId: string, propertyId: string): Promise<string | null> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const records = await base('UserProperties')
        .select({
          filterByFormula: `AND({UserId} = '${userId}', {PropertyId} = '${propertyId}')`,
          maxRecords: 1,
          fields: ['UserId', 'PropertyId', 'Role']
        })
        .firstPage();

      if (records.length === 0) {
        return null;
      }

      return records[0].get('Role') as string;
    } catch (error) {
      console.error('Error getting user property role:', error);
      throw error;
    }
  },

  async canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
    try {
      const role = await this.getUserPropertyRole(userId, propertyId);
      return role !== null;
    } catch (error) {
      console.error('Error checking property access:', error);
      throw error;
    }
  },

  async filterAccessibleProperties(userId: string, properties: Property[]): Promise<Property[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      // Récupérer toutes les associations utilisateur-propriété pour cet utilisateur
      const records = await base('UserProperties')
        .select({
          filterByFormula: `{UserId} = '${userId}'`,
          fields: ['UserId', 'PropertyId', 'Role']
        })
        .all();

      // Créer un Set des IDs de propriétés accessibles
      const accessiblePropertyIds = new Set(
        records.map(record => record.get('PropertyId'))
      );

      // Filtrer les propriétés
      return properties.filter(property => accessiblePropertyIds.has(property.id));
    } catch (error) {
      console.error('Error filtering accessible properties:', error);
      throw error;
    }
  },

  async filterAccessibleConversations(userId: string, conversations: Conversation[]): Promise<Conversation[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      // Récupérer toutes les associations utilisateur-propriété pour cet utilisateur
      const records = await base('UserProperties')
        .select({
          filterByFormula: `{UserId} = '${userId}'`,
          fields: ['UserId', 'PropertyId', 'Role']
        })
        .all();

      // Créer un Set des IDs de propriétés accessibles
      const accessiblePropertyIds = new Set(
        records.map(record => record.get('PropertyId'))
      );

      // Filtrer les conversations
      return conversations.filter(conversation => {
        const propertyId = conversation.fields.Properties?.[0];
        return propertyId && accessiblePropertyIds.has(propertyId);
      });
    } catch (error) {
      console.error('Error filtering accessible conversations:', error);
      throw error;
    }
  }
};
