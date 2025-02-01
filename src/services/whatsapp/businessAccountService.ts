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
  private readonly table = base('Users');

  async getAccountConfig(userId: string): Promise<WhatsAppConfig | null> {
    try {
      const record = await this.table.find(userId);
      
      if (!record) {
        return null;
      }

      return {
        appId: process.env.WHATSAPP_APP_ID || '',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
        phoneNumberId: record.get('whatsapp_phone_number_id') as string,
        apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration WhatsApp:', error);
      return null;
    }
  }

  async updateBusinessProfile(userId: string, businessProfile: Partial<BusinessProfile>): Promise<void> {
    try {
      await this.table.update(userId, {
        whatsapp_business_profile: JSON.stringify({
          name: businessProfile.name || '',
          description: businessProfile.description || '',
          address: businessProfile.address || '',
          email: businessProfile.email || '',
          vertical: 'HOSPITALITY',
        })
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil business:', error);
      throw error;
    }
  }

  async setPhoneNumberId(userId: string, phoneNumberId: string): Promise<void> {
    try {
      await this.table.update(userId, {
        whatsapp_phone_number_id: phoneNumberId,
        whatsapp_status: 'active'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du phone number ID:', error);
      throw error;
    }
  }
}

export const whatsappBusinessAccountService = new WhatsAppBusinessAccountService();
