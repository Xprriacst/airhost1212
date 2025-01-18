import { base } from '../airtable/config';
import type { Property, Conversation, UserProperty } from '../../types';

class AuthorizationService {
  async getUserProperties(userId: string): Promise<UserProperty[]> {
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
        .firstPage();

      return records.map(record => ({
        userId: record.get('User ID') as string,
        propertyId: record.get('Property ID') as string,
        role: record.get('Role') as string,
        createdAt: record.get('Date') as string,
        createdBy: record.get('Created By') as string
      }));
    } catch (error) {
      console.error('Error fetching user properties:', error);
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

  async canAccessConversation(userId: string, conversation: Conversation): Promise<boolean> {
    try {
      const propertyId = conversation.fields?.Properties?.[0] || conversation.propertyId;
      if (!propertyId) {
        console.error('No property ID found for conversation');
        return false;
      }
      return this.canAccessProperty(userId, propertyId);
    } catch (error) {
      console.error('Error checking conversation access:', error);
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
