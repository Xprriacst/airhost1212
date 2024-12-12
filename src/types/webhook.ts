import { z } from 'zod';

export const incomingMessageSchema = z.object({
  propertyId: z.string(),
  guestName: z.string(),
  guestEmail: z.string().email(),
  message: z.string(),
  platform: z.enum(['whatsapp', 'sms', 'email']).default('whatsapp'),
  timestamp: z.string().datetime().optional()
});

export type IncomingMessage = z.infer<typeof incomingMessageSchema>;

export interface WebhookResponse {
  success: boolean;
  conversation?: string;
  aiResponse?: string;
  error?: string;
}