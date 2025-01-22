import { describe, expect, it, jest } from '@jest/globals';
import { conversationService } from '../conversationService';
import { base } from '../config';
import type { User } from '../../../types';

describe('conversationService', () => {
  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    role: 'user'
  };

  const mockRecord = {
    id: 'rec123',
    fields: {
      'Guest Name': 'John Doe',
      'Guest Email': 'john@example.com',
      'Guest Phone': '1234567890',
      'Messages': '[]',
      'Properties': ['prop1'],
      'Property ID': 'prop1',
      'Auto Pilot': false,
      'Unread Count': 0,
      'User ID': 'user123',
      'Check-in Date': '2023-01-01',
      'Check-out Date': '2023-01-02',
      'Emergency Tags': []
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapRecordToConversation', () => {
    it('should correctly map Airtable record to Conversation', async () => {
      const conversation = await conversationService.mapRecordToConversation(mockRecord);

      expect(conversation).toEqual({
        id: 'rec123',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '1234567890',
        messages: [],
        properties: ['prop1'],
        propertyId: 'prop1',
        autoPilot: false,
        unreadCount: 0,
        userId: 'user123',
        checkIn: '2023-01-01',
        checkOut: '2023-01-02',
        emergencyTags: []
      });
    });

    it('should handle missing fields', async () => {
      const incompleteRecord = {
        id: 'rec123',
        fields: {}
      };

      const conversation = await conversationService.mapRecordToConversation(incompleteRecord);

      expect(conversation).toEqual({
        id: 'rec123',
        guestName: 'Invité',
        guestEmail: '',
        guestPhone: '',
        messages: [],
        properties: [],
        propertyId: '',
        autoPilot: false,
        unreadCount: 0,
        userId: null,
        checkIn: '',
        checkOut: '',
        emergencyTags: []
      });
    });
  });
});
