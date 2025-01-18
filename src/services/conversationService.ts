import { conversationService as airtableConversationService } from './airtable/conversationService';
import { authorizationService } from './authorizationService';
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
  async fetchAllConversations(userId: string): Promise<Conversation[]> {
    const conversations = await airtableConversationService.fetchAllConversations();
    return authorizationService.filterAccessibleConversations(userId, conversations);
  },

  async fetchPropertyConversations(userId: string, propertyId: string): Promise<Conversation[]> {
    const canAccess = await authorizationService.canAccessProperty(userId, propertyId);
    if (!canAccess) {
      throw new Error('Unauthorized access to property conversations');
    }
    return airtableConversationService.fetchPropertyConversations(propertyId);
  },

  async fetchConversationById(userId: string, conversationId: string): Promise<Conversation> {
    const conversation = await airtableConversationService.fetchConversationById(conversationId);
    const canAccess = await authorizationService.canAccessConversation(userId, conversation);
    if (!canAccess) {
      throw new Error('Unauthorized access to conversation');
    }
    return conversation;
  },

  async updateConversation(userId: string, conversationId: string, data: Record<string, any>) {
    const conversation = await airtableConversationService.fetchConversationById(conversationId);
    const canAccess = await authorizationService.canAccessConversation(userId, conversation);
    if (!canAccess) {
      throw new Error('Unauthorized access to update conversation');
    }

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

  async addConversation(userId: string, conversationData: Record<string, any>) {
    const canAccess = await authorizationService.canAccessProperty(userId, conversationData.propertyId);
    if (!canAccess) {
      throw new Error('Unauthorized access to add conversation');
    }
    return airtableConversationService.addConversation(conversationData);
  },

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await airtableConversationService.fetchConversationById(conversationId);
    const canAccess = await authorizationService.canAccessConversation(userId, conversation);
    if (!canAccess) {
      throw new Error('Unauthorized access to delete conversation');
    }
    return airtableConversationService.deleteConversation(conversationId);
  },
};
