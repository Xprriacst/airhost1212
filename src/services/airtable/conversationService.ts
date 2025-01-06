import { base } from './config';
import { handleServiceError } from '../../utils/error';
import type { Conversation, Message } from '../../types';

const parseMessages = (rawMessages: any): Message[] => {
  try {
    if (!rawMessages) return [];
    return typeof rawMessages === 'string' ? JSON.parse(rawMessages) : rawMessages;
  } catch (error) {
    console.warn('Failed to parse messages:', error);
    return [];
  }
};

const mapAirtableToConversation = (record: any): Conversation => {
  const propertyIds = record.get('Properties');
  return {
    id: record.id,
    propertyId: Array.isArray(propertyIds) ? propertyIds[0] : propertyIds,
    guestName: record.get('Guest Name') || '',
    guestEmail: record.get('Guest Email') || '',
    guestPhone: record.get('Guest phone number') || '',
    checkIn: record.get('Check-in Date') || '',
    checkOut: record.get('Check-out Date') || '',
    autoPilot: record.get('Auto Pilot') || false,
    messages: parseMessages(record.get('Messages')),
    unreadCount: record.get('UnreadCount') || 0
  };
};

export const conversationService = {
  async fetchAllConversations(): Promise<Conversation[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const records = await base('Conversations')
        .select({
          fields: [
            'Properties',
            'Guest Name',
            'Guest Email',
            'Guest phone number',
            'Messages',
            'Check-in Date',
            'Check-out Date',
            'Auto Pilot',
            'UnreadCount'
          ],
        })
        .all();

      return records.map(mapAirtableToConversation);
    } catch (error) {
      console.error('Error fetching all conversations:', error);
      throw error;
    }
  },

  async fetchConversationById(conversationId: string): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!conversationId) throw new Error('Conversation ID is required');

      console.log('Fetching conversation:', conversationId);
      const record = await base('Conversations').find(conversationId);
      
      if (!record) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      return mapAirtableToConversation(record);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  async fetchPropertyConversations(propertyId: string): Promise<Conversation[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!propertyId) throw new Error('Property ID is required');

      console.log('Fetching conversations for property:', propertyId);
      const records = await base('Conversations')
        .select({
          filterByFormula: `SEARCH("${propertyId}", {Properties})`,
          fields: [
            'Properties',
            'Guest Name',
            'Guest Email',
            'Guest phone number',
            'Messages',
            'Check-in Date',
            'Check-out Date',
            'Auto Pilot',
            'UnreadCount'
          ],
        })
        .all();

      return records.map(mapAirtableToConversation);
    } catch (error) {
      console.error('Error fetching property conversations:', error);
      throw error;
    }
  },

  async updateConversation(
    conversationId: string, 
    data: { Messages?: string; unreadCount?: number }
  ): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const formattedData = {
        ...data,
        Messages: data.Messages,
        'UnreadCount': data.unreadCount
      };

      const response = await base('Conversations')
        .update(conversationId, formattedData);

      return mapAirtableToConversation(response);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  async incrementUnreadCount(conversationId: string): Promise<void> {
    try {
      const conversation = await this.fetchConversationById(conversationId);
      const currentCount = conversation.unreadCount || 0;
      await this.updateConversation(conversationId, {
        unreadCount: currentCount + 1
      });
    } catch (error) {
      console.error('Error incrementing unread count:', error);
      throw error;
    }
  },

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      await this.updateConversation(conversationId, {
        'UnreadCount': 0
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  async addConversation(data: Record<string, any>): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      console.log('Creating new conversation with data:', data);

      // S'assurer que Properties est un tableau
      const formattedData = {
        ...data,
        Properties: Array.isArray(data.Properties) ? data.Properties : [data.Properties],
        Messages: data.Messages || '[]',
        'Auto Pilot': false, // Désactivé par défaut
        'UnreadCount': 0
      };

      console.log('Formatted data for Airtable:', formattedData);

      const record = await base('Conversations').create(formattedData);
      console.log('Created conversation record:', record.id);
      
      return mapAirtableToConversation(record);
    } catch (error) {
      console.error('Error adding conversation:', error);
      throw error;
    }
  },

  async deleteConversation(conversationId: string): Promise<boolean> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!conversationId) throw new Error('Conversation ID is required');

      await base('Conversations').destroy(conversationId);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};
