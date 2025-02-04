import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhookHandler';
import { formatPhoneNumber } from '../utils';
import { whatsappConfig, WhatsAppUserConfig } from '../../../config/whatsapp';

describe('WebhookHandler', () => {
  const mockConversationService = {
    createOrUpdateConversation: vi.fn(),
    findConversationByPhone: vi.fn(),
    getUserIdByPhoneNumberId: vi.fn()
  };

  const mockUserConfig: WhatsAppUserConfig = {
    phoneNumberId: '461158110424411',
    appId: '123456789',
    accessToken: 'test_token',
    verifyToken: 'test_verify_token',
    displayName: 'Test Property',
    businessId: 'test_business_id'
  };

  let handler: WebhookHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationService.getUserIdByPhoneNumberId.mockResolvedValue('test_user_id');
    handler = new WebhookHandler(mockConversationService);
  });

  describe('handleOfficialWebhook', () => {
    it('devrait traiter un message texte entrant', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: mockUserConfig.phoneNumberId,
          changes: [{
            value: {
              messages: [{
                from: '33617370484',
                text: { body: 'Message test' },
                timestamp: '1675439335',
                type: 'text',
                id: 'wamid.123'
              }]
            }
          }]
        }]
      };

      await handler.handleOfficialWebhook(webhookData);

      expect(mockConversationService.createOrUpdateConversation).toHaveBeenCalledWith({
        guestPhone: '+33617370484',
        message: 'Message test',
        platform: 'whatsapp',
        waMessageId: 'wamid.123',
        timestamp: expect.any(String)
      });
    });

    it('devrait vérifier le token de validation', async () => {
      const verifyToken = mockUserConfig.verifyToken;
      const mode = 'subscribe';
      const challenge = '1234567890';
      const token = verifyToken;

      const result = handler.verifyWebhook({ mode, challenge, token });

      expect(result).toEqual({
        isValid: true,
        challenge: '1234567890'
      });
    });

    it('devrait rejeter un token invalide', () => {
      const mode = 'subscribe';
      const challenge = '1234567890';
      const token = 'invalid_token';

      const result = handler.verifyWebhook({ mode, challenge, token });

      expect(result).toEqual({
        isValid: false,
        challenge: null
      });
    });

    it('devrait gérer les messages de différents utilisateurs avec leurs configurations respectives', async () => {
      const user1Config: WhatsAppUserConfig = {
        ...mockUserConfig,
        phoneNumberId: '111111111',
        displayName: 'Property 1'
      };

      const user2Config: WhatsAppUserConfig = {
        ...mockUserConfig,
        phoneNumberId: '222222222',
        displayName: 'Property 2'
      };

      // Simuler deux messages de différents utilisateurs
      const webhookData1 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: user1Config.phoneNumberId,
          changes: [{
            value: {
              messages: [{
                from: '33617370484',
                text: { body: 'Message pour property 1' },
                timestamp: '1675439335',
                type: 'text',
                id: 'wamid.123'
              }]
            }
          }]
        }]
      };

      const webhookData2 = {
        object: 'whatsapp_business_account',
        entry: [{
          id: user2Config.phoneNumberId,
          changes: [{
            value: {
              messages: [{
                from: '33617370485',
                text: { body: 'Message pour property 2' },
                timestamp: '1675439336',
                type: 'text',
                id: 'wamid.456'
              }]
            }
          }]
        }]
      };

      // Configurer les mocks pour retourner différents userIds
      mockConversationService.getUserIdByPhoneNumberId
        .mockImplementation((phoneNumberId: string) => {
          if (phoneNumberId === user1Config.phoneNumberId) return 'user1_id';
          if (phoneNumberId === user2Config.phoneNumberId) return 'user2_id';
          return null;
        });

      await handler.handleOfficialWebhook(webhookData1);
      await handler.handleOfficialWebhook(webhookData2);

      expect(mockConversationService.createOrUpdateConversation).toHaveBeenCalledTimes(2);
      expect(mockConversationService.createOrUpdateConversation).toHaveBeenNthCalledWith(1, {
        guestPhone: '+33617370484',
        message: 'Message pour property 1',
        platform: 'whatsapp',
        waMessageId: 'wamid.123',
        timestamp: expect.any(String),
        userId: 'user1_id'
      });

      expect(mockConversationService.createOrUpdateConversation).toHaveBeenNthCalledWith(2, {
        guestPhone: '+33617370485',
        message: 'Message pour property 2',
        platform: 'whatsapp',
        waMessageId: 'wamid.456',
        timestamp: expect.any(String),
        userId: 'user2_id'
      });
    });
  });
});
