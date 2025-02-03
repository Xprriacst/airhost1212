import { WhatsAppServiceFactory } from '../whatsapp/factory';
import { OfficialWhatsAppService } from '../whatsapp/officialService';
import { MakeWhatsAppService } from '../whatsapp/makeService';
import { WhatsAppConfig } from '../../types/whatsapp';

describe('WhatsApp Service Tests', () => {
  const mockConfig: WhatsAppConfig = {
    provider: 'official',
    appId: process.env.WHATSAPP_APP_ID || '1676211843267502',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'EAAX0gXt8e64BO58jZC1RTxYIgmorutcI5iw5ZCUlnLZAhMQW9aA4MBFCRgDm6vi7RNa2DCMu6Vrw6q6GoCpZCcS4qpjNFOg5lRZCLorfp5OX7KzIoUCRmqzUVOrB97og2aa6GAB8nLEBCbJP3dItY0hfo0vzX3JnKarq0aABMLZBPLxN1CYm3mzrgZCJc1SeGoXlrNi3nyJFsMUiO6P25GflilJ',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
    phoneNumberId: '461158110424411',
    apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`
  };

  describe('WhatsAppServiceFactory', () => {
    it('should create an OfficialWhatsAppService instance', () => {
      const factory = WhatsAppServiceFactory.getInstance();
      const service = factory.getService(mockConfig);
      expect(service).toBeInstanceOf(OfficialWhatsAppService);
    });

    it('should reuse existing service instance', () => {
      const factory = WhatsAppServiceFactory.getInstance();
      const service1 = factory.getService(mockConfig);
      const service2 = factory.getService(mockConfig);
      expect(service1).toBe(service2);
    });
  });

  describe('OfficialWhatsAppService', () => {
    let service: OfficialWhatsAppService;

    beforeEach(() => {
      service = new OfficialWhatsAppService(mockConfig);
    });

    it('should have sendMessage method', () => {
      expect(service.sendMessage).toBeDefined();
      expect(typeof service.sendMessage).toBe('function');
    });

    it('should send a message successfully', async () => {
      const phoneNumber = '+33617374784';
      const content = {
        type: 'text' as const,
        text: 'Test message from Jest 🧪'
      };

      const messageId = await service.sendMessage(phoneNumber, content);
      expect(messageId).toBeTruthy();
      expect(typeof messageId).toBe('string');
    });
  });

  describe('Integration Test', () => {
    it('should send a real message through the factory', async () => {
      const factory = WhatsAppServiceFactory.getInstance();
      const service = factory.getService(mockConfig);
      
      const phoneNumber = '+33617374784';
      const content = {
        type: 'text' as const,
        text: 'Test message through factory 🏭'
      };

      const messageId = await service.sendMessage(phoneNumber, content);
      expect(messageId).toBeTruthy();
      console.log('Message envoyé avec succès, ID:', messageId);
    });
  });
});
