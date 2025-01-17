import { render, screen, fireEvent, act } from '@testing-library/react';
import { ConversationDetail } from '../ConversationDetail';
import { useConversationStore } from '../../stores/conversationStore';
import { aiService } from '../../services/ai/aiService';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock des hooks
jest.mock('../../stores/conversationStore', () => ({
  useConversationStore: jest.fn()
}));
jest.mock('../../services/ai/aiService');

describe('ConversationDetail Mobile Tests', () => {
  const mockConversation = {
    id: '1',
    propertyId: 'prop1',
    propertyName: 'Beach House',
    propertyType: 'house',
    guestName: 'John Doe',
    checkIn: '2025-01-15',
    checkOut: '2025-01-20',
    messages: [
      {
        id: '1',
        conversationId: '1',
        content: 'Hello',
        sender: 'guest',
        timestamp: new Date('2025-01-15T10:00:00'),
        type: 'text',
        status: 'sent'
      }
    ],
    unreadCount: 0
  };

  const mockFetchConversation = jest.fn();
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    (useConversationStore as unknown as jest.Mock).mockReturnValue({
      conversation: mockConversation,
      fetchConversation: mockFetchConversation,
      sendMessage: mockSendMessage
    });

    jest.spyOn(aiService, 'generateResponse').mockImplementation(() => Promise.resolve('AI response'));
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/conversation/1']}>
        <Routes>
          <Route path="/conversation/:id" element={<ConversationDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('should render the header with guest name and dates', () => {
    renderComponent();
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/Check-in: 1\/15\/2025/)).toBeInTheDocument();
    expect(screen.getByText(/Check-out: 1\/20\/2025/)).toBeInTheDocument();
  });

  it('should keep the header visible when keyboard is open', () => {
    renderComponent();
    
    const header = screen.getByTestId('conversation-header');
    expect(header).toHaveStyle({ position: 'fixed', top: '0' });
  });

  it('should keep focus on textarea after sending a message', async () => {
    renderComponent();
    
    const textarea = screen.getByPlaceholderText(/Type your message/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Hello!' } });
      await Promise.resolve();
    });

    await act(async () => {
      fireEvent.click(sendButton);
      await Promise.resolve();
    });

    await act(async () => {
      textarea.focus();
      await Promise.resolve();
    });

    expect(document.activeElement).toBe(textarea);
  });
});
