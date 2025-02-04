import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhookHandler';
import { userService } from '../../airtable/userService';
import { WhatsAppUserConfig } from '../../../config/whatsapp';

describe('WhatsApp Integration Tests', () => {
  const mockUserId = 'test-user-123';
  const mockUserConfig: WhatsAppUserConfig = {
    phoneNumberId: '461158110424411',
    appId: '123456789',
    accessToken: 'test-token',
    verifyToken: 'test-verify-token',
    displayName: 'Test Property',
    businessId: 'test-business-id'
  };

  const mockConversationService = {
    createOrUpdateConversation: vi.fn(),
    findConversationByPhone: vi.fn(),
    getUserIdByPhoneNumberId: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockConversationService.getUserIdByPhoneNumberId.mockResolvedValue(mockUserId);
    vi.spyOn(userService, 'getWhatsAppConfig').mockResolvedValue(mockUserConfig);
  });

  describe('Flux de réception de message', () => {
    it('devrait traiter un message entrant avec la configuration utilisateur', async () => {
      const handler = new WebhookHandler(mockConversationService);

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

      expect(mockConversationService.getUserIdByPhoneNumberId)
        .toHaveBeenCalledWith(mockUserConfig.phoneNumberId);
      expect(mockConversationService.createOrUpdateConversation)
        .toHaveBeenCalledWith({
          guestPhone: '+33617370484',
          message: 'Message test',
          platform: 'whatsapp',
          waMessageId: 'wamid.123',
          timestamp: expect.any(String),
          userId: mockUserId
        });
    });

    it('devrait ignorer les messages des utilisateurs non configurés', async () => {
      const handler = new WebhookHandler(mockConversationService);
      mockConversationService.getUserIdByPhoneNumberId.mockResolvedValueOnce(null);

      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'unknown-phone-number-id',
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

      expect(mockConversationService.createOrUpdateConversation).not.toHaveBeenCalled();
    });
  });

  describe('Validation du webhook', () => {
    it('devrait valider le webhook avec le token spécifique à l\'utilisateur', async () => {
      const handler = new WebhookHandler(mockConversationService);

      const verificationData = {
        mode: 'subscribe',
        token: mockUserConfig.verifyToken,
        challenge: '1234567890'
      };

      const result = await handler.verifyWebhook(verificationData, mockUserConfig.phoneNumberId);

      expect(result).toEqual({
        isValid: true,
        challenge: verificationData.challenge
      });
    });

    it('devrait rejeter la validation avec un token incorrect', async () => {
      const handler = new WebhookHandler(mockConversationService);

      const verificationData = {
        mode: 'subscribe',
        token: 'wrong-token',
        challenge: '1234567890'
      };

      const result = await handler.verifyWebhook(verificationData, mockUserConfig.phoneNumberId);

      expect(result).toEqual({
        isValid: false,
        challenge: null
      });
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de récupération de configuration utilisateur', async () => {
      const handler = new WebhookHandler(mockConversationService);
      vi.spyOn(userService, 'getWhatsAppConfig').mockRejectedValueOnce(new Error('Test error'));

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

      await expect(handler.handleOfficialWebhook(webhookData)).resolves.not.toThrow();
      expect(mockConversationService.createOrUpdateConversation).not.toHaveBeenCalled();
    });

    it('devrait gérer les erreurs de création de conversation', async () => {
      const handler = new WebhookHandler(mockConversationService);
      mockConversationService.createOrUpdateConversation.mockRejectedValueOnce(new Error('Test error'));

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

      await expect(handler.handleOfficialWebhook(webhookData)).resolves.not.toThrow();
    });
  });
});
