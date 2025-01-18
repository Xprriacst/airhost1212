import { base } from './config';
import { handleServiceError } from '../../utils/error';
import { UserProperty } from '../../types/auth';

const mapAirtableToUserProperty = (record: any): UserProperty => ({
  userId: record.get('User ID'),
  propertyId: record.get('Property ID'),
  role: record.get('Role'),
  createdAt: record.get('Date'),
  createdBy: record.get('Created By'),
});

export const userPropertyService = {
  async getUserProperties(userId: string): Promise<UserProperty[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('User Properties')
        .select({
          filterByFormula: `{User ID} = '${userId}'`,
          fields: ['User ID', 'Property ID', 'Role', 'Date', 'Created By']
        })
        .all();

      return records.map(mapAirtableToUserProperty);
    } catch (error) {
      console.error('Error getting user properties:', error);
      throw handleServiceError(error);
    }
  },

  async getPropertyUsers(propertyId: string): Promise<UserProperty[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('User Properties')
        .select({
          filterByFormula: `{Property ID} = '${propertyId}'`,
          fields: ['User ID', 'Property ID', 'Role', 'Date', 'Created By']
        })
        .all();

      return records.map(mapAirtableToUserProperty);
    } catch (error) {
      console.error('Error getting property users:', error);
      throw handleServiceError(error);
    }
  },

  async addUserProperty(data: UserProperty): Promise<UserProperty> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const record = await base('User Properties').create({
        'User ID': data.userId,
        'Property ID': data.propertyId,
        'Role': data.role,
        'Date': data.createdAt,
        'Created By': data.createdBy
      });

      return mapAirtableToUserProperty(record);
    } catch (error) {
      console.error('Error adding user property:', error);
      throw handleServiceError(error);
    }
  },

  async updateUserPropertyRole(
    userId: string,
    propertyId: string,
    role: 'owner' | 'manager' | 'viewer'
  ): Promise<UserProperty> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      // Trouver l'enregistrement existant
      const records = await base('User Properties')
        .select({
          filterByFormula: `AND({User ID} = '${userId}', {Property ID} = '${propertyId}')`,
          maxRecords: 1
        })
        .all();

      if (records.length === 0) {
        throw new Error('User property relationship not found');
      }

      // Mettre à jour le rôle
      const updatedRecord = await base('User Properties').update(records[0].id, {
        'Role': role
      });

      return mapAirtableToUserProperty(updatedRecord);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async removeUserProperty(userId: string, propertyId: string): Promise<void> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('User Properties')
        .select({
          filterByFormula: `AND({User ID} = '${userId}', {Property ID} = '${propertyId}')`,
          maxRecords: 1
        })
        .all();

      if (records.length > 0) {
        await base('User Properties').destroy(records[0].id);
      }
    } catch (error) {
      throw handleServiceError(error);
    }
  }
};
