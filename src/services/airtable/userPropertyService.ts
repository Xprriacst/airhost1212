import { base } from './config';
import { handleServiceError } from '../../utils/error';
import { UserPropertyRecord } from '../../types/auth';

const mapAirtableToUserProperty = (record: any): UserPropertyRecord => ({
  userId: record.get('User ID'),
  propertyId: record.get('Property ID'),
  role: record.get('Role'),
  createdAt: new Date(record.get('Created At')),
  createdBy: record.get('Created By'),
});

export const userPropertyService = {
  async getUserProperties(userId: string): Promise<UserPropertyRecord[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('User Properties')
        .select({
          filterByFormula: `{User ID} = '${userId}'`,
          fields: ['User ID', 'Property ID', 'Role', 'Created At', 'Created By']
        })
        .all();

      return records.map(mapAirtableToUserProperty);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async getPropertyUsers(propertyId: string): Promise<UserPropertyRecord[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('User Properties')
        .select({
          filterByFormula: `{Property ID} = '${propertyId}'`,
          fields: ['User ID', 'Property ID', 'Role', 'Created At', 'Created By']
        })
        .all();

      return records.map(mapAirtableToUserProperty);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async addUserProperty(data: Omit<UserPropertyRecord, 'createdAt'>): Promise<UserPropertyRecord> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const record = await base('User Properties').create({
        'User ID': data.userId,
        'Property ID': data.propertyId,
        'Role': data.role,
        'Created By': data.createdBy
      });

      return mapAirtableToUserProperty(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async updateUserPropertyRole(
    userId: string,
    propertyId: string,
    role: 'owner' | 'manager' | 'viewer'
  ): Promise<UserPropertyRecord> {
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
