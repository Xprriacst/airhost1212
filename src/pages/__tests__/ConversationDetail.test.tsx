/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useParams, useNavigate } from 'react-router-dom';
import ConversationDetail from '../ConversationDetail';
import { conversationService } from '../../services';
import { propertyService } from '../../services/airtable/propertyService';
import { aiService } from '../../services/ai/aiService';
import userEvent from '@testing-library/user-event';

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
    guestCount: 2,
    guestPhone: '+33123456789',
    autoPilot: false
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
    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/votre message/i)).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText(/votre message/i);
    const sendButton = screen.getByLabelText(/envoyer/i);

    fireEvent.change(input, { target: { value: 'Nouveau message' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(conversationService.updateConversation).toHaveBeenCalled();
      const updateCall = (conversationService.updateConversation as jest.Mock).mock.calls[0];
      expect(updateCall[0]).toBe('conv-1');
      expect(JSON.parse(updateCall[1].Messages)).toContainEqual(
        expect.objectContaining({
          text: 'Nouveau message',
          sender: 'host'
        })
      );
    });
  });

  it('devrait générer une réponse AI quand on clique sur le bouton Sparkles', async () => {
    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/générer une réponse/i)).toBeInTheDocument();
    });

    const generateButton = screen.getByLabelText(/générer une réponse/i);
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(aiService.generateResponse).toHaveBeenCalledWith(
        mockConversation.messages[0],
        mockProperty,
        {
          hasBooking: true,
          checkIn: mockConversation.checkIn,
          checkOut: mockConversation.checkOut,
          guestCount: mockConversation.guestCount
        },
        mockConversation.messages.slice(-10),
        {
          language: 'fr',
          tone: 'friendly',
          shouldIncludeEmoji: true
        }
      );
    });

    // Vérifier que la réponse générée est mise dans le champ de texte
    const input = screen.getByPlaceholderText(/votre message/i);
    expect(input).toHaveValue('Réponse AI simulée');
  });

  it('devrait gérer les erreurs lors de la génération de réponse AI', async () => {
    (aiService.generateResponse as jest.Mock).mockRejectedValueOnce(new Error('Erreur API'));

    render(
      <BrowserRouter>
        <ConversationDetail />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/générer une réponse/i)).toBeInTheDocument();
    });

    const generateButton = screen.getByLabelText(/générer une réponse/i);
    await userEvent.click(generateButton);

    await waitFor(() => {
      expect(aiService.generateResponse).toHaveBeenCalled();
    });

    // Vérifier que le champ de texte n'a pas été modifié
    const input = screen.getByPlaceholderText(/votre message/i);
    expect(input).toHaveValue('');
  });
});
