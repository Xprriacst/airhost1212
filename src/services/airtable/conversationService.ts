import { base } from './config';
import { handleServiceError } from '../../utils/error';
import axios from 'axios';
import type { Conversation, Message, EmergencyTag } from '../../types';
import { authService, authorizationService } from '..';

const parseMessages = (rawMessages: any): Message[] => {
  try {
    if (!rawMessages) return [];
    
    let messages: Message[] = typeof rawMessages === 'string' 
      ? JSON.parse(rawMessages) 
      : rawMessages;

    return messages.map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
      sender: msg.sender === 'Host' || msg.sender === 'host' 
        ? 'host' 
        : 'guest',
      type: msg.type || 'text',
      status: msg.status || 'sent'
    })).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  } catch (error) {
    console.warn('Failed to parse messages:', error);
    return [];
  }
};

// Mapping function for Airtable records
const mapAirtableToConversation = (record: any): Conversation => {
  const properties = record.fields.Properties;
  return {
    id: record.id,
    propertyId: Array.isArray(properties) ? properties[0] : properties,
    Properties: properties,
    'Guest Name': record.fields['Guest Name'],
    'Guest Email': record.fields['Guest Email'],
    'Guest phone number': record.fields['Guest phone number'],
    Messages: record.fields.Messages,
    'Check-in Date': record.fields['Check-in Date'],
    'Check-out Date': record.fields['Check-out Date'],
    'Auto Pilot': record.fields['Auto Pilot'],
    UnreadCount: record.fields.UnreadCount || 0
  };
};

const sendNotification = async (title: string, body: string) => {
  try {
    console.log('Sending notification:', { title, body });
    const response = await axios.post(`${process.env.REACT_APP_API_URL}/send-notification`, {
      title,
      body,
    });
    console.log('Notification sent:', response.data);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Mots-clés pour détecter les cas d'urgence
const EMERGENCY_KEYWORDS = {
  client_mecontent: ['insatisfait', 'mécontent', 'déçu', 'remboursement', 'plainte', 'inacceptable'],
  probleme_technique: ['panne', 'cassé', 'ne fonctionne pas', 'problème', 'fuite', 'électricité'],
  probleme_stock: ['manque', 'vide', 'épuisé', 'plus de', 'besoin de'],
  reponse_inconnue: ['pas de réponse', 'sans réponse', 'urgent', 'besoin maintenant'],
  urgence: ['urgent', 'immédiat', 'emergency', 'secours', 'danger', 'grave']
};

// Fonction pour détecter les tags d'urgence dans un message
const detectEmergencyTags = (message: string): EmergencyTag[] => {
  const lowercaseMessage = message.toLowerCase();
  return Object.entries(EMERGENCY_KEYWORDS).reduce((tags: EmergencyTag[], [tag, keywords]) => {
    if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      tags.push(tag as EmergencyTag);
    }
    return tags;
  }, []);
};

export const conversationService = {
  async fetchAllConversations(): Promise<Conversation[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

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

      const conversations = records.map(mapAirtableToConversation);
      return await authorizationService.filterAccessibleConversations(user.id, conversations);
    } catch (error) {
      console.error('Error fetching all conversations:', error);
      throw error;
    }
  },

  async fetchConversationById(conversationId: string): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!conversationId) throw new Error('Conversation ID is required');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching conversation:', conversationId);
      const record = await base('Conversations').find(conversationId);
      
      if (!record) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const conversation = mapAirtableToConversation(record);
      
      // Utiliser Properties s'il existe, sinon utiliser propertyId
      const propertyId = conversation.fields?.Properties?.[0] || conversation.propertyId;
      if (!propertyId) {
        throw new Error('No property ID found for conversation');
      }
      
      console.log('[Conversation] Checking access to property:', propertyId, 'for user:', user.id);
      const hasAccess = await authorizationService.canAccessProperty(user.id, propertyId);
      if (!hasAccess) {
        console.error('[Conversation] Access denied to property:', propertyId);
        throw new Error('Access denied to this conversation');
      }

      return conversation;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  async fetchPropertyConversations(propertyId: string): Promise<Conversation[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!propertyId) throw new Error('Property ID is required');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

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

      const conversations = records.map(mapAirtableToConversation);
      return await authorizationService.filterAccessibleConversations(user.id, conversations);
    } catch (error) {
      console.error('Error fetching property conversations:', error);
      throw error;
    }
  },

  async updateConversation(
    conversationId: string, 
    data: { Messages?: string; unreadCount?: number; 'Auto Pilot'?: boolean }
  ): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      const formattedData: Record<string, any> = {};
      
      if (data.Messages) {
        formattedData.Messages = data.Messages;
        const messages = JSON.parse(data.Messages);
        if (Array.isArray(messages) && messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          if (lastMessage.sender === 'guest' && lastMessage.text?.trim()) {
            // Détecter les tags d'urgence dans le dernier message
            const emergencyTags = detectEmergencyTags(lastMessage.text);
            
            // Si des tags d'urgence sont détectés
            if (emergencyTags.length > 0) {
              console.log('Emergency tags detected:', emergencyTags);
              
              // Ajouter les tags au message
              lastMessage.emergencyTags = emergencyTags;
              
              // Désactiver l'Auto Pilot
              formattedData['Auto Pilot'] = false;
              
              // Mettre à jour le message avec les tags
              messages[messages.length - 1] = lastMessage;
              formattedData.Messages = JSON.stringify(messages);
              
              // Envoyer une notification d'urgence
              await sendNotification(
                'Message urgent détecté !',
                `Auto-pilot désactivé\nTags: ${emergencyTags.join(', ')}\nMessage: ${lastMessage.text}`
              );
            }

            // Envoyer une notification normale si ce n'est pas un message WhatsApp
            if (lastMessage.platform !== 'whatsapp') {
              await sendNotification(
                'Nouveau message', 
                lastMessage.text
              );
            }
          }
        }
      }

      if (data.unreadCount !== undefined) {
        formattedData.UnreadCount = data.unreadCount;
      }

      if (data['Auto Pilot'] !== undefined) {
        formattedData['Auto Pilot'] = data['Auto Pilot'];
      }

      const record = await base('Conversations').update(conversationId, formattedData);
      return mapAirtableToConversation(record);
    } catch (error) {
      throw handleServiceError(error);
    }
  },

  async updateConversationWithoutAuth(conversationId: string, data: Record<string, any>): Promise<Conversation> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const record = await base('Conversations').update(conversationId, data);
      return mapAirtableToConversation(record);
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },

  async getAllConversationsWithoutAuth(): Promise<Conversation[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const records = await base('Conversations').select({
        view: 'Grid view'
      }).all();

      return records.map(mapAirtableToConversation);
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw error;
    }
  },

  async incrementUnreadCount(conversationId: string): Promise<void> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Récupérer le compteur actuel
      const conversation = await this.fetchConversationById(conversationId);
      const currentCount = conversation.UnreadCount || 0;
      const newCount = currentCount + 1;

      // Mettre à jour directement dans Airtable
      await base('Conversations').update(conversationId, {
        'UnreadCount': newCount
      });

      // Mettre à jour localement via updateConversation
      await this.updateConversation(conversationId, {
        unreadCount: newCount
      });
    } catch (error) {
      console.error('Error incrementing unread count:', error);
      throw error;
    }
  },

  async markConversationAsRead(conversationId: string): Promise<void> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      // Mettre à jour directement dans Airtable
      await base('Conversations').update(conversationId, {
        'UnreadCount': 0
      });

      // Mettre à jour localement via updateConversation
      await this.updateConversation(conversationId, {
        unreadCount: 0
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  async addConversation(data: Record<string, any>): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

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
      
      const conversation = mapAirtableToConversation(record);
      // Utiliser la propriété déjà mappée dans la conversation
      const hasAccess = await authorizationService.canAccessProperty(user.id, conversation.Properties);
      if (!hasAccess) {
        console.error('Access denied to property:', conversation.Properties);
        throw new Error('Access denied to this conversation');
      }

      return conversation;
    } catch (error) {
      console.error('Error adding conversation:', error);
      throw error;
    }
  },

  async addConversationWithoutAuth(data: Record<string, any>): Promise<Conversation> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const record = await base('Conversations').create(data);
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

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      await base('Conversations').destroy(conversationId);
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};
