import { base } from './base';
import { handleServiceError } from '../../utils/error';
import type { Conversation, Message, EmergencyTag } from '../../types';

const CONVERSATIONS_TABLE = 'Conversations';
const MESSAGES_TABLE = 'Messages';

export const conversationService = {
  // Convertir les messages Airtable en messages de l'application
  mapMessages: (messages: any[]): Message[] => {
    return messages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversationId,
      content: msg.content,
      timestamp: new Date(msg.timestamp),
      sender: msg.sender === 'Host' || msg.sender === 'host' ? 'host' : 'guest',
      type: msg.type || 'text',
      status: msg.status || 'sent'
    }));
  },

  // Convertir une conversation Airtable en conversation de l'application
  mapConversation: (record: any, messages: Message[] = [], propertyIds: string | string[] = []): Conversation => ({
    id: record.id,
    propertyId: Array.isArray(propertyIds) ? propertyIds[0] : propertyIds,
    propertyName: record.propertyName || '',
    propertyType: record.propertyType || '',
    guestName: record.guestName || '',
    checkIn: record.checkIn || '',
    checkOut: record.checkOut || '',
    messages,
    unreadCount: record.unreadCount || 0,
    lastMessage: messages[messages.length - 1]
  }),

  // Récupérer toutes les conversations
  async getConversations(): Promise<Conversation[]> {
    try {
      const records = await base(CONVERSATIONS_TABLE)
        .select({
          view: 'Grid view',
          sort: [{ field: 'Created', direction: 'desc' }]
        })
        .all();

      const conversations: Conversation[] = [];

      for (const record of records) {
        const messages = await this.getMessages(record.id);
        conversations.push(
          this.mapConversation(
            {
              id: record.id,
              ...record.fields
            },
            messages,
            record.fields.PropertyId
          )
        );
      }

      return conversations;
    } catch (error) {
      throw handleServiceError(error, 'conversationService.getConversations');
    }
  },

  // Récupérer une conversation par son ID
  async getConversation(id: string): Promise<Conversation> {
    try {
      const record = await base(CONVERSATIONS_TABLE).find(id);
      const messages = await this.getMessages(id);

      return this.mapConversation(
        {
          id: record.id,
          ...record.fields
        },
        messages,
        record.fields.PropertyId
      );
    } catch (error) {
      throw handleServiceError(error, 'conversationService.getConversation');
    }
  },

  // Récupérer les messages d'une conversation
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const records = await base(MESSAGES_TABLE)
        .select({
          filterByFormula: `{ConversationId} = '${conversationId}'`,
          sort: [{ field: 'Created', direction: 'asc' }]
        })
        .all();

      return this.mapMessages(
        records.map(record => ({
          id: record.id,
          ...record.fields,
          conversationId
        }))
      );
    } catch (error) {
      throw handleServiceError(error, 'conversationService.getMessages');
    }
  },

  // Envoyer un message
  async sendMessage(conversationId: string, content: string, sender: 'guest' | 'host'): Promise<Message> {
    try {
      const record = await base(MESSAGES_TABLE).create({
        ConversationId: conversationId,
        Content: content,
        Sender: sender,
        Timestamp: new Date().toISOString()
      });

      return {
        id: record.id,
        conversationId,
        content,
        sender,
        timestamp: new Date(),
        type: 'text',
        status: 'sent'
      };
    } catch (error) {
      throw handleServiceError(error, 'conversationService.sendMessage');
    }
  },

  // Marquer une conversation comme lue
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId);
      if (conversation.unreadCount === 0) return;

      await base(CONVERSATIONS_TABLE).update(conversationId, {
        UnreadCount: 0
      });
    } catch (error) {
      throw handleServiceError(error, 'conversationService.markAsRead');
    }
  },

  // Incrémenter le compteur de messages non lus
  async incrementUnreadCount(conversationId: string): Promise<void> {
    try {
      const conversation = await this.getConversation(conversationId);
      const currentCount = conversation.unreadCount || 0;

      await base(CONVERSATIONS_TABLE).update(conversationId, {
        UnreadCount: currentCount + 1
      });
    } catch (error) {
      throw handleServiceError(error, 'conversationService.incrementUnreadCount');
    }
  }
};
