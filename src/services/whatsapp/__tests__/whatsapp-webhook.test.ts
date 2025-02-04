import { describe, it, expect, vi, beforeEach } from 'vitest';
import { whatsappBusinessAccountService } from '../businessAccountService';
import { whatsappConfig } from '../../../config/whatsapp';
import { WebhookHandler } from '../webhookHandler';
import crypto from 'crypto';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

vi.mock('../businessAccountService');

describe('WhatsApp Webhook Handler', () => {
  let handler: WebhookHandler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = new WebhookHandler(whatsappBusinessAccountService);
  });
  const mockEvent: Partial<APIGatewayProxyEvent> = {
    httpMethod: '',
    headers: {},
    body: '',
    queryStringParameters: {}
  };



  describe('Vérification du Webhook', () => {
    it('devrait valider le hub.challenge', () => {
      const event = {
        ...mockEvent,
        httpMethod: 'GET',
        queryStringParameters: {
          'hub.mode': 'subscribe',
          'hub.verify_token': whatsappConfig.verifyToken,
          'hub.challenge': '1234567890'
        }
      };

      const response = handler(event, {} as any);
      expect(response.statusCode).toBe(200);
      expect(response.body).toBe('1234567890');
    });

    it('devrait rejeter un token invalide', () => {
      const event = {
        ...mockEvent,
        httpMethod: 'GET',
        queryStringParameters: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'invalid_token',
          'hub.challenge': '1234567890'
        }
      };

      const response = handler(event, {} as any);
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Traitement des Messages', () => {
    const generateSignature = (body: string) => {
      const hash = crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET || '')
        .update(body)
        .digest('hex');
      return `sha256=${hash}`;
    };

    it('devrait traiter un message texte', async () => {
      const messagePayload = {
        object: 'whatsapp_business_account',
        entry: [{
          id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '+33617370484',
                phone_number_id: '477925252079395'
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

      const body = JSON.stringify(messagePayload);
      const signature = generateSignature(body);

      const event = {
        ...mockEvent,
        httpMethod: 'POST',
        headers: {
          'x-hub-signature-256': signature
        },
        body
      };

      const response = await handler(event, {} as any);
      expect(response.statusCode).toBe(200);
      expect(whatsappBusinessAccountService.handleMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '33617370484',
          text: { body: 'Message test' }
        })
      );
    });

    it('devrait rejeter une signature invalide', async () => {
      const event = {
        ...mockEvent,
        httpMethod: 'POST',
        headers: {
          'x-hub-signature-256': 'invalid_signature'
        },
        body: JSON.stringify({ test: 'data' })
      };

      const response = await handler(event, {} as any);
      expect(response.statusCode).toBe(401);
    });
  });
});
