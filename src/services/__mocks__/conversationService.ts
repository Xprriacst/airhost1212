import type { Conversation } from '../../types';

const mockConversation: Conversation = {
  id: 'conv1',
  guestName: 'John Doe',
  guestLanguage: 'fr',
  propertyName: 'Villa Paradis',
  propertyType: 'Villa',
  checkInDate: '2023-12-01',
  checkOutDate: '2023-12-08',
  messages: [
    {
      id: 'msg1',
      conversationId: 'conv1',
      content: 'Bonjour, je suis intéressé par votre logement.',
      sender: 'guest',
      timestamp: '2023-11-30T10:00:00Z'
    }
  ],
  autoPilot: false
};

export const conversationService = {
  fetchConversationById: jest.fn().mockResolvedValue(mockConversation),
  updateConversation: jest.fn().mockResolvedValue(mockConversation),
  markConversationAsRead: jest.fn().mockResolvedValue(true)
};
