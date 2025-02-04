import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhookHandler';
import { conversationService } from '../../airtable/conversationService';
import { whatsappConfig } from '../../../config/whatsapp';
import crypto from 'crypto';

// Mock du service de conversation
vi.mock('../../airtable/conversationService', () => ({
  conversationService: {
    createOrUpdateConversation: vi.fn(),
    findConversationByPhone: vi.fn()
  }
}));

describe('WebhookHandler - API Officielle WhatsApp', () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WebhookHandler(conversationService);
  });

  describe('Vérification du Webhook', () => {
    it('devrait accepter une requête de vérification valide', () => {
      const result = handler.verifyWebhook({
        mode: 'subscribe',
        challenge: '1234567890',
        token: whatsappConfig.verifyToken
      });

      expect(result).toEqual({
        isValid: true,
        challenge: '1234567890'
      });
    });

    it('devrait rejeter une requête avec un token invalide', () => {
      const result = handler.verifyWebhook({
        mode: 'subscribe',
        challenge: '1234567890',
        token: 'invalid_token'
      });

      expect(result).toEqual({
        isValid: false,
        challenge: null
      });
    });
  });

  describe('Traitement des Messages', () => {
    it('devrait traiter un message texte simple', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: whatsappConfig.phoneNumberId,
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+33617370484',
                phone_number_id: whatsappConfig.phoneNumberId
              },
              messages: [{
                from: '33617370484',
                id: 'wamid.123',
                timestamp: '1675439335',
                text: { body: 'Message test' },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await handler.handleOfficialWebhook(webhookData);

      expect(conversationService.createOrUpdateConversation).toHaveBeenCalledWith({
        guestPhone: '+33617370484',
        message: 'Message test',
        platform: 'whatsapp',
        waMessageId: 'wamid.123',
        timestamp: expect.any(String)
      });
    });

    it('devrait ignorer les messages non textuels', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: whatsappConfig.phoneNumberId,
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+33617370484',
                phone_number_id: whatsappConfig.phoneNumberId
              },
              messages: [{
                from: '33617370484',
                id: 'wamid.123',
                timestamp: '1675439335',
                type: 'image',
                image: {
                  mime_type: 'image/jpeg',
                  sha256: 'hash',
                  id: 'image.123'
                }
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await handler.handleOfficialWebhook(webhookData);

      expect(conversationService.createOrUpdateConversation).not.toHaveBeenCalled();
    });

    it('devrait gérer les mises à jour de statut des messages', async () => {
      const webhookData = {
        object: 'whatsapp_business_account',
        entry: [{
          id: whatsappConfig.phoneNumberId,
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+33617370484',
                phone_number_id: whatsappConfig.phoneNumberId
              },
              statuses: [{
                id: 'wamid.123',
                status: 'delivered',
                timestamp: '1675439335',
                recipient_id: '33617370484'
              }]
            },
            field: 'messages'
          }]
        }]
      };

      await handler.handleOfficialWebhook(webhookData);

      // TODO: Implémenter la gestion des statuts
      // expect(conversationService.updateMessageStatus).toHaveBeenCalledWith(
      //   'wamid.123',
      //   'delivered'
      // );
    });
  });
});
