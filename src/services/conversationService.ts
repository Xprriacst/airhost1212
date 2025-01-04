import { airtableConversationService } from './airtable/conversationService';
import type { Conversation } from '../types';

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
    return airtableConversationService.updateConversation(conversationId, data);
  },

  async addConversation(conversationData: Record<string, any>) {
    return airtableConversationService.addConversation(conversationData);
  },

  async deleteConversation(conversationId: string) {
    return airtableConversationService.deleteConversation(conversationId);
  },
};
