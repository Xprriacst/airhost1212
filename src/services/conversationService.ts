import { conversationService as airtableConversationService } from './airtable/conversationService';
import type { Conversation } from '../types';
import axios from 'axios';

const sendNotification = async (title: string, body: string) => {
  try {
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-notification`, {
      title,
      body
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const conversationService = {
  async fetchAllConversations(): Promise<Conversation[]> {
    return airtableConversationService.fetchAllConversations();
  },

  async fetchPropertyConversations(propertyId: string): Promise<Conversation[]> {
    return airtableConversationService.fetchPropertyConversations(propertyId);
  },

  async fetchConversationById(conversationId: string): Promise<Conversation> {
    return airtableConversationService.fetchConversationById(conversationId);
  },

  async updateConversation(conversationId: string, data: Record<string, any>) {
    const result = await airtableConversationService.updateConversation(conversationId, data);
    
    // Si c'est un nouveau message
    if (data.messages && Array.isArray(data.messages)) {
      const lastMessage = data.messages[data.messages.length - 1];
      if (lastMessage) {
        await sendNotification(
          'Nouveau message',
          `${lastMessage.sender}: ${lastMessage.content}`
        );
      }
    }
    
    return result;
  },

  async addConversation(conversationData: Record<string, any>) {
    return airtableConversationService.addConversation(conversationData);
  },

  async deleteConversation(conversationId: string) {
    return airtableConversationService.deleteConversation(conversationId);
  },
};
