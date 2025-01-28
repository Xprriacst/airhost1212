/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import ConversationDetail from '../ConversationDetail';
import { conversationService } from '../../services';
import { propertyService } from '../../services/airtable/propertyService';
import { aiService } from '../../services/ai/aiService';

// Mocks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  useNavigate: jest.fn()
}));

jest.mock('../../services', () => ({
  conversationService: {
    fetchConversationById: jest.fn(),
    updateConversation: jest.fn()
  }
}));

jest.mock('../../services/airtable/propertyService', () => ({
  propertyService: {
    fetchPropertyById: jest.fn()
  }
}));

jest.mock('../../services/ai/aiService', () => ({
  aiService: {
    generateResponse: jest.fn()
  }
}));

// Mock du store Zustand
const mockUseAuthStore = jest.fn();
jest.mock('../../stores/authStore', () => ({
  useAuthStore: () => mockUseAuthStore()
}));

describe('ConversationDetail', () => {
  const mockNavigate = jest.fn();
  const mockUser = { id: 'user-1', email: 'test@example.com' };
  const mockConversation = {
    id: 'conv-1',
    guestName: 'John Doe',
    guestEmail: 'john@example.com',
    messages: [
      {
        id: 'msg-1',
        text: 'Bonjour',
        sender: 'guest',
        timestamp: new Date('2025-01-28T21:53:30.286Z')
      }
    ],
    checkIn: '2025-02-01',
    checkOut: '2025-02-05',
    guestCount: 2
  };
  const mockProperty = {
    id: 'prop-1',
    name: 'Test Property',
    aiInstructions: [
      {
        id: 'instr-1',
        propertyId: 'prop-1',
        type: 'general',
        content: 'Instructions test',
        isActive: true,
        priority: 1
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useParams as jest.Mock).mockReturnValue({ conversationId: 'conv-1', propertyId: 'prop-1' });
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    mockUseAuthStore.mockReturnValue({ user: mockUser });
    (conversationService.fetchConversationById as jest.Mock).mockResolvedValue(mockConversation);
    (propertyService.fetchPropertyById as jest.Mock).mockResolvedValue(mockProperty);
    (aiService.generateResponse as jest.Mock).mockResolvedValue('Réponse AI simulée');
  });

  it('devrait charger la conversation et la propriété au montage', async () => {
    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(conversationService.fetchConversationById).toHaveBeenCalledWith(mockUser.id, 'conv-1');
      expect(propertyService.fetchPropertyById).toHaveBeenCalledWith('prop-1');
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Bonjour')).toBeInTheDocument();
  });

  it('devrait permettre d\'envoyer un nouveau message', async () => {
    // Mock Date.now() pour avoir un id prévisible
    const mockDate = new Date('2025-01-28T21:53:31.000Z');
    jest.spyOn(global.Date, 'now').mockImplementation(() => mockDate.getTime());

    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByPlaceholderText('Votre message...'));

    const input = screen.getByPlaceholderText('Votre message...');
    fireEvent.change(input, { target: { value: 'Nouveau message' } });

    const sendButton = screen.getByLabelText('Envoyer');
    fireEvent.click(sendButton);

    await waitFor(() => {
      const updateCall = (conversationService.updateConversation as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('conv-1');

      const messages = JSON.parse(updateCall[1].Messages);
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({
        id: 'msg-1',
        text: 'Bonjour',
        sender: 'guest',
        timestamp: '2025-01-28T21:53:30.286Z'
      });
      expect(messages[1]).toMatchObject({
        id: expect.any(String),
        text: 'Nouveau message',
        sender: 'host',
        timestamp: expect.any(String)
      });
    });

    // Restaurer Date.now()
    jest.restoreAllMocks();
  });

  it('devrait générer une réponse AI', async () => {
    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByLabelText('Générer une réponse'));

    const generateButton = screen.getByLabelText('Générer une réponse');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(aiService.generateResponse).toHaveBeenCalledWith(
        mockConversation.messages[0],
        mockProperty,
        expect.objectContaining({
          hasBooking: true,
          checkIn: mockConversation.checkIn,
          checkOut: mockConversation.checkOut,
          guestCount: mockConversation.guestCount
        }),
        mockConversation.messages,
        expect.objectContaining({
          language: 'fr',
          tone: 'friendly',
          shouldIncludeEmoji: true
        })
      );
    });

    const input = screen.getByPlaceholderText('Votre message...');
    expect(input).toHaveValue('Réponse AI simulée');
  });

  it('devrait rediriger vers l\'accueil si les paramètres sont manquants', () => {
    (useParams as jest.Mock).mockReturnValue({ conversationId: undefined, propertyId: undefined });
    
    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
