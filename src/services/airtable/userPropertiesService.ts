import { base } from './config';

export const userPropertiesService = {
  async addUserProperty(userId: string, propertyId: string, role: string): Promise<boolean> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      // Vérifier si l'association existe déjà
      const existingRecords = await base('UserProperties')
        .select({
          filterByFormula: `AND({UserId} = '${userId}', {PropertyId} = '${propertyId}')`,
          maxRecords: 1,
          fields: ['UserId', 'PropertyId', 'Role']
        })
        .firstPage();

      if (existingRecords.length > 0) {
        // Mettre à jour le rôle si l'association existe déjà
        await base('UserProperties').update(existingRecords[0].id, {
          Role: role
        });
      } else {
        // Créer une nouvelle association
        await base('UserProperties').create([
          {
            fields: {
              UserId: userId,
              PropertyId: propertyId,
              Role: role
            }
          }
        ]);
      }

      return true;
    } catch (error) {
      console.error('Error adding user property:', error);
      throw error;
    }
  },

  async getUserProperties(userId: string): Promise<any[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const records = await base('UserProperties')
        .select({
          filterByFormula: `{UserId} = '${userId}'`,
          fields: ['UserId', 'PropertyId', 'Role']
        })
        .all();

      return records.map(record => ({
        id: record.id,
        userId: record.get('UserId'),
        propertyId: record.get('PropertyId'),
        role: record.get('Role')
      }));
    } catch (error) {
      console.error('Error getting user properties:', error);
      throw error;
    }
  }
};
