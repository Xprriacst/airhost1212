import { describe, expect, it, vi, beforeEach } from 'vitest';
import { userService } from '../userService';
import { base } from '../config';
import type { User } from '../../../types';
import { WhatsAppUserConfig } from '../../../config/whatsapp';

vi.mock('../config', () => ({
  base: {
    table: vi.fn()
  }
}));

describe('userService', () => {
  const mockWhatsAppConfig: WhatsAppUserConfig = {
    phoneNumberId: '461158110424411',
    appId: '123456789',
    accessToken: 'test_token',
    verifyToken: 'test_verify_token',
    displayName: 'Test Property',
    businessId: 'test_business_id'
  };

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    role: 'user',
    whatsapp_business_config: mockWhatsAppConfig
  };

  const mockRecord = {
    id: mockUser.id,
    fields: {
      'Email': mockUser.email,
      'Role': mockUser.role,
      'WhatsApp Business Config': {
        phone_number_id: mockWhatsAppConfig.phoneNumberId,
        app_id: mockWhatsAppConfig.appId,
        access_token: mockWhatsAppConfig.accessToken,
        verify_token: mockWhatsAppConfig.verifyToken,
        display_name: mockWhatsAppConfig.displayName,
        business_id: mockWhatsAppConfig.businessId,
        status: 'active'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (base.table as jest.Mock).mockReturnValue({
      find: vi.fn().mockResolvedValue(mockRecord),
      select: vi.fn().mockReturnValue({
        firstPage: vi.fn().mockResolvedValue([mockRecord])
      }),
      update: vi.fn().mockResolvedValue([mockRecord])
    });
  });

  describe('getWhatsAppConfig', () => {
    it('devrait récupérer la configuration WhatsApp d\'un utilisateur', async () => {
      const config = await userService.getWhatsAppConfig('user123');
      expect(config).toEqual(mockWhatsAppConfig);
    });

    it('devrait retourner null si l\'utilisateur n\'existe pas', async () => {
      (base.table as jest.Mock)().find.mockResolvedValueOnce(null);
      const config = await userService.getWhatsAppConfig('invalid_user');
      expect(config).toBeNull();
    });

    it('devrait retourner null si l\'utilisateur n\'a pas de configuration WhatsApp', async () => {
      (base.table as jest.Mock)().find.mockResolvedValueOnce({
        ...mockRecord,
        fields: {
          ...mockRecord.fields,
          'WhatsApp Business Config': null
        }
      });
      const config = await userService.getWhatsAppConfig('user123');
      expect(config).toBeNull();
    });
  });

  describe('updateWhatsAppConfig', () => {
    it('devrait mettre à jour la configuration WhatsApp d\'un utilisateur', async () => {
      const newConfig: WhatsAppUserConfig = {
        ...mockWhatsAppConfig,
        displayName: 'Updated Property Name'
      };

      await userService.updateWhatsAppConfig('user123', newConfig);

      expect(base.table('Users').update).toHaveBeenCalledWith(mockUser.id, {
        'WhatsApp Business Config': {
          phone_number_id: newConfig.phoneNumberId,
          app_id: newConfig.appId,
          access_token: newConfig.accessToken,
          verify_token: newConfig.verifyToken,
          display_name: newConfig.displayName,
          business_id: newConfig.businessId,
          status: 'active'
        }
      });
    });

    it('devrait échouer si l\'utilisateur n\'existe pas', async () => {
      (base.table as jest.Mock)().find.mockResolvedValueOnce(null);
      
      await expect(userService.updateWhatsAppConfig('invalid_user', mockWhatsAppConfig))
        .rejects.toThrow('Utilisateur non trouvé');
    });
  });
});
