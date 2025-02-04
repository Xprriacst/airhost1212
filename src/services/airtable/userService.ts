import { base } from './config';
import type { User } from '../../types';
import { WhatsAppUserConfig } from '../../config/whatsapp';

class UserService {
  private readonly table = base.table('Users');

  async getWhatsAppConfig(userId: string): Promise<WhatsAppUserConfig | null> {
    try {
      const record = await this.table.find(userId);
      if (!record) return null;

      const config = record.fields['WhatsApp Business Config'];
      if (!config) return null;

      return {
        phoneNumberId: config.phone_number_id,
        appId: config.app_id,
        accessToken: config.access_token,
        verifyToken: config.verify_token,
        displayName: config.display_name,
        businessId: config.business_id
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration WhatsApp:', error);
      return null;
    }
  }

  async updateWhatsAppConfig(userId: string, config: WhatsAppUserConfig): Promise<void> {
    const user = await this.table.find(userId);
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    await this.table.update(userId, {
      'WhatsApp Business Config': {
        phone_number_id: config.phoneNumberId,
        app_id: config.appId,
        access_token: config.accessToken,
        verify_token: config.verifyToken,
        display_name: config.displayName,
        business_id: config.businessId,
        status: 'active'
      }
    });
  }

  async getUserByPhoneNumberId(phoneNumberId: string): Promise<User | null> {
    try {
      const records = await this.table.select({
        filterByFormula: `{WhatsApp Business Config}.phone_number_id = '${phoneNumberId}'`
      }).firstPage();

      if (records.length === 0) return null;

      const record = records[0];
      return {
        id: record.id,
        email: record.fields['Email'],
        role: record.fields['Role'],
        whatsapp_business_config: record.fields['WhatsApp Business Config']
      };
    } catch (error) {
      console.error('Erreur lors de la recherche de l\'utilisateur par phoneNumberId:', error);
      return null;
    }
  }
}

export const userService = new UserService();
