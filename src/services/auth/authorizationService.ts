import { base } from '../airtable/config';
import type { Property, Conversation } from '../../types';

class AuthorizationService {
  async getUserProperties(userId: string): Promise<any[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      console.log('[Auth] Fetching properties for user', userId);

      const records = await base('User Properties')
        .select({
          filterByFormula: `{User ID} = '${userId}'`,
          fields: ['User ID', 'Property ID', 'Role', 'Date', 'Created By']
        })
        .all();

      return records.map(record => ({
        userId: record.get('User ID'),
        propertyId: record.get('Property ID'),
        role: record.get('Role'),
        date: record.get('Date'),
        createdBy: record.get('Created By')
      }));
    } catch (error) {
      console.error('Error getting user properties:', error);
      throw error;
    }
  }

  async canAccessProperty(userId: string, propertyId: string): Promise<boolean> {
    try {
      const userProperties = await this.getUserProperties(userId);
      return userProperties.some(up => up.propertyId === propertyId);
    } catch (error) {
      console.error('Error checking property access:', error);
      return false;
    }
  }

  async filterAccessibleProperties(userId: string, properties: Property[]): Promise<Property[]> {
    try {
      const userProperties = await this.getUserProperties(userId);
      return properties.filter(property => 
        userProperties.some(up => up.propertyId === property.id)
      );
    } catch (error) {
      console.error('Error filtering properties:', error);
      return [];
    }
  }

  async filterAccessibleConversations(userId: string, conversations: Conversation[]): Promise<Conversation[]> {
    try {
      const userProperties = await this.getUserProperties(userId);
      return conversations.filter(conversation => {
        const propertyId = conversation.fields.Properties?.[0];
        return propertyId && userProperties.some(up => up.propertyId === propertyId);
      });
    } catch (error) {
      console.error('Error filtering accessible conversations:', error);
      return [];
    }
  }
}

export const authorizationService = new AuthorizationService();
