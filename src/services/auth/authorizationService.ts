import { base } from '../airtable/config';
import { authService } from './authService';
import type { Property, Conversation } from '../../types';

class AuthorizationService {
  private static TABLE_NAME = 'UserProperties';

  async getUserPropertyRole(userId: string, propertyId: string): Promise<string | null> {
    try {
      if (!base) return null;

      const records = await base(AuthorizationService.TABLE_NAME)
        .select({
          filterByFormula: `AND({UserId} = '${userId}', {PropertyId} = '${propertyId}')`,
        })
        .firstPage();

      return records.length > 0 ? (records[0].fields.Role as string) : null;
    } catch (error) {
      console.error('Error getting user property role:', error);
      return null;
    }
  }

  async canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
    const role = await this.getUserPropertyRole(userId, propertyId);
    return role !== null;
  }

  async filterAccessibleProperties(userId: string, properties: Property[]): Promise<Property[]> {
    try {
      if (!base) return [];

      // Récupérer toutes les associations utilisateur-propriété pour cet utilisateur
      const records = await base(AuthorizationService.TABLE_NAME)
        .select({
          filterByFormula: `{UserId} = '${userId}'`,
        })
        .firstPage();

      // Créer un Set des IDs de propriétés accessibles
      const accessiblePropertyIds = new Set(
        records.map(record => record.fields.PropertyId as string)
      );

      // Filtrer les propriétés selon les droits d'accès
      return properties.filter(property => accessiblePropertyIds.has(property.id));
    } catch (error) {
      console.error('Error filtering accessible properties:', error);
      return [];
    }
  }

  async filterAccessibleConversations(userId: string, conversations: Conversation[]): Promise<Conversation[]> {
    try {
      if (!base) return [];

      // Récupérer toutes les associations utilisateur-propriété pour cet utilisateur
      const records = await base(AuthorizationService.TABLE_NAME)
        .select({
          filterByFormula: `{UserId} = '${userId}'`,
        })
        .firstPage();

      // Créer un Set des IDs de propriétés accessibles
      const accessiblePropertyIds = new Set(
        records.map(record => record.fields.PropertyId as string)
      );

      // Filtrer les conversations selon les droits d'accès aux propriétés
      return conversations.filter(conversation => 
        accessiblePropertyIds.has(conversation.fields.PropertyId as string)
      );
    } catch (error) {
      console.error('Error filtering accessible conversations:', error);
      return [];
    }
  }

  async updatePropertyRole(userId: string, propertyId: string, role: string): Promise<boolean> {
    try {
      if (!base) return false;

      const records = await base(AuthorizationService.TABLE_NAME)
        .select({
          filterByFormula: `AND({UserId} = '${userId}', {PropertyId} = '${propertyId}')`,
        })
        .firstPage();

      if (records.length > 0) {
        await base(AuthorizationService.TABLE_NAME).update(records[0].id, {
          fields: { Role: role },
        });
      } else {
        await base(AuthorizationService.TABLE_NAME).create([
          {
            fields: {
              UserId: userId,
              PropertyId: propertyId,
              Role: role,
            },
          },
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error updating property role:', error);
      return false;
    }
  }
}

export const authorizationService = new AuthorizationService();
