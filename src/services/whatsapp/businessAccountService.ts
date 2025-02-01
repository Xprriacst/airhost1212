import { base } from '../airtable/config';
import { WhatsAppConfig, WhatsAppStatus, BusinessHour } from '../../types/whatsapp';

interface BusinessProfile {
  name: string;
  description: string;
  address: string;
  email: string;
  vertical: string;
}

interface WhatsAppBusinessSettings {
  notification_email: string;
  auto_reply: boolean;
  business_hours: BusinessHour[];
  business_profile: BusinessProfile;
  message_templates: any[];
}

interface WhatsAppBusinessAccount extends WhatsAppConfig {
  business_id: string;
  webhook_secret: string;
  business_settings: WhatsAppBusinessSettings;
}

class WhatsAppBusinessAccountService {
  private readonly table = base('WhatsAppAccounts');

  async createAccount(userId: string, phoneNumber: string, businessProfile: Partial<BusinessProfile>): Promise<WhatsAppBusinessAccount> {
    try {
      // 1. Créer le compte avec les informations de base
      const [record] = await this.table.create([
        {
          fields: {
            user_id: userId,
            phone_number: phoneNumber,
            provider: 'official',
            status: 'pending',
            settings: JSON.stringify({
              notification_email: '',
              auto_reply: false,
              business_hours: [],
              business_profile: {
                name: businessProfile.name || '',
                description: businessProfile.description || '',
                address: businessProfile.address || '',
                email: businessProfile.email || '',
                vertical: 'HOSPITALITY',
              },
              message_templates: [],
            }),
          },
        },
      ]);

      return this.mapRecord(record);
    } catch (error) {
      console.error('Erreur lors de la création du compte WhatsApp:', error);
      throw error;
    }
  }

  async getAccountByUserId(userId: string): Promise<WhatsAppBusinessAccount | null> {
    try {
      const records = await this.table.select({
        filterByFormula: `{user_id} = '${userId}'`,
        maxRecords: 1,
      }).firstPage();

      if (records.length === 0) return null;

      return this.mapRecord(records[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération du compte WhatsApp:', error);
      throw error;
    }
  }

  async getAccountByPhoneNumber(phoneNumber: string): Promise<WhatsAppBusinessAccount | null> {
    try {
      const records = await this.table.select({
        filterByFormula: `{phone_number} = '${phoneNumber}'`,
        maxRecords: 1,
      }).firstPage();

      if (records.length === 0) return null;

      return this.mapRecord(records[0]);
    } catch (error) {
      console.error('Erreur lors de la récupération du compte WhatsApp par numéro:', error);
      throw error;
    }
  }

  async updateAccount(accountId: string, updates: Partial<WhatsAppBusinessAccount>): Promise<WhatsAppBusinessAccount> {
    try {
      const [record] = await this.table.update([
        {
          id: accountId,
          fields: {
            ...updates,
            settings: updates.settings ? JSON.stringify(updates.settings) : undefined,
          },
        },
      ]);

      return this.mapRecord(record);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du compte WhatsApp:', error);
      throw error;
    }
  }

  async updateAccountStatus(accountId: string, status: WhatsAppStatus): Promise<void> {
    try {
      await this.table.update([
        {
          id: accountId,
          fields: { status },
        },
      ]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  async deleteAccount(accountId: string): Promise<void> {
    try {
      await this.table.destroy([accountId]);
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      throw error;
    }
  }

  private mapRecord(record: any): WhatsAppBusinessAccount {
    const fields = record.fields;
    return {
      id: record.id,
      user_id: fields.user_id,
      business_id: fields.business_id || '',
      phone_number: fields.phone_number,
      waba_id: fields.waba_id || '',
      webhook_url: fields.webhook_url || '',
      webhook_secret: fields.webhook_secret || '',
      api_key: fields.api_key || '',
      created_at: fields.created_at || new Date().toISOString(),
      updated_at: fields.updated_at || new Date().toISOString(),
      status: fields.status as WhatsAppStatus,
      provider: 'official',
      settings: fields.settings ? JSON.parse(fields.settings) : {},
      business_settings: fields.business_settings ? JSON.parse(fields.business_settings) : {
        notification_email: '',
        auto_reply: false,
        business_hours: [],
        business_profile: {
          name: '',
          description: '',
          address: '',
          email: '',
          vertical: 'HOSPITALITY',
        },
        message_templates: [],
      },
    };
  }
}

export const whatsappBusinessAccountService = new WhatsAppBusinessAccountService();
