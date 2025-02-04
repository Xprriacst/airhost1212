import 'openai/shims/node';
import type { Message, Property } from '../../../types';
import type { BookingContext, AIConfig } from '../types';
import { aiService } from '../aiService';

// Mock OpenAI
vi.mock('openai', () => {
  const mockCreate = vi.fn();

  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

describe('aiService', () => {
  const mockProperty: Property = {
    id: 'test-property',
    name: 'Test Property',
    aiInstructions: JSON.stringify([{
      id: 'instr1',
      propertyId: 'test-property',
      type: 'general',
      content: 'Instructions test pour l\'IA',
      isActive: true,
      priority: 1
    }])
  };

  const mockMessage: Message = {
    id: 'test-message',
    text: 'Message test',
    sender: 'guest',
    timestamp: new Date()
  };

  const mockBookingContext: BookingContext = {
    hasBooking: true,
    checkIn: '2025-02-01',
    checkOut: '2025-02-05',
    guestCount: 2
  };

  const mockConfig: AIConfig = {
    language: 'fr',
    tone: 'friendly',
    shouldIncludeEmoji: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Configuration par défaut
    const mockCreate = jest.requireMock('openai').default().chat.completions.create;
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Réponse simulée de l\'IA' } }]
    });
  });

  it('devrait générer une réponse avec le contexte complet', async () => {
    const response = await aiService.generateResponse(
      mockMessage,
      mockProperty,
      mockBookingContext,
      [],
      mockConfig
    );

    expect(response).toBe('Réponse simulée de l\'IA');
  });

  it('devrait gérer un contexte de réservation vide', async () => {
    const response = await aiService.generateResponse(
      mockMessage,
      mockProperty,
      { hasBooking: false },
      []
    );

    expect(response).toBe('Réponse simulée de l\'IA');
  });

  it('devrait gérer une erreur de l\'API OpenAI', async () => {
    const mockCreate = jest.requireMock('openai').default().chat.completions.create;
    mockCreate.mockRejectedValueOnce(new Error('Erreur API'));

    await expect(aiService.generateResponse(
      mockMessage,
      mockProperty,
      { hasBooking: false },
      []
    )).rejects.toThrow('Erreur API');
  });
});
