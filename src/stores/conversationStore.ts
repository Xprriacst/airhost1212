import { create } from 'zustand';
import { conversationService } from '../services/airtable/conversationService';
import type { Conversation, Message } from '../types';

interface ConversationStore {
  conversation: Conversation | null;
  fetchConversation: (id: string) => Promise<void>;
  sendMessage: (message: Message) => Promise<void>;
}

type ConversationState = {
  conversation: Conversation | null;
};

type ConversationActions = {
  fetchConversation: (id: string) => Promise<void>;
  sendMessage: (message: Message) => Promise<void>;
};

export const useConversationStore = create<ConversationStore>((set) => ({
  conversation: null,

  fetchConversation: async (id: string) => {
    try {
      const conversation = await conversationService.getConversation(id);
      set({ conversation });
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  },

  sendMessage: async (message: Message) => {
    try {
      await conversationService.sendMessage(
        message.conversationId,
        message.content,
        message.sender
      );

      set((state: ConversationState) => ({
        conversation: state.conversation
          ? {
              ...state.conversation,
              messages: [...state.conversation.messages, message]
            }
          : null
      }));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}));
