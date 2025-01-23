import { base } from './config';
import { handleServiceError } from '../../utils/error';
import axios from 'axios';
import type { Conversation, Message, EmergencyTag } from '../../types';
import { authService, authorizationService } from '..';

const parseMessages = (rawMessages: any): Message[] => {
  try {
    if (!rawMessages) return [];
    
    // Si c'est déjà un tableau, on traite directement les messages
    if (Array.isArray(rawMessages)) {
      return rawMessages
        .filter(msg => msg && typeof msg === 'object')
        .map(msg => ({
          id: msg.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: msg.text || msg.content || '',
          timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          sender: (msg.sender || '').toLowerCase() === 'host' ? 'host' : 'guest',
          type: msg.type || 'text',
          status: msg.status || 'sent',
          metadata: msg.metadata || {}
        }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    
    // Si c'est une chaîne, on essaie de la parser
    if (typeof rawMessages === 'string') {
      try {
        // Nettoyage de la chaîne avant parsing
        const cleanedString = rawMessages.trim();
        if (!cleanedString) return [];
        
        // Si la chaîne commence par '[', c'est probablement un tableau JSON
        if (cleanedString.startsWith('[')) {
          const parsed = JSON.parse(cleanedString);
          if (Array.isArray(parsed)) {
            return parseMessages(parsed);
          }
        }
        
        // Si c'est une chaîne simple, on la traite comme un message unique
        return [{
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: cleanedString,
          timestamp: new Date(),
          sender: 'guest',
          type: 'text',
          status: 'sent',
          metadata: {}
        }];
      } catch (e) {
        console.warn('Failed to parse messages string:', e);
        return [];
      }
    }
    
    // Si c'est un objet unique, on le traite comme un message unique
    if (typeof rawMessages === 'object' && rawMessages !== null) {
      return [{
        id: rawMessages.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: rawMessages.text || rawMessages.content || '',
        timestamp: rawMessages.timestamp ? new Date(rawMessages.timestamp) : new Date(),
        sender: (rawMessages.sender || '').toLowerCase() === 'host' ? 'host' : 'guest',
        type: rawMessages.type || 'text',
        status: rawMessages.status || 'sent',
        metadata: rawMessages.metadata || {}
      }];
    }
    
    console.warn('Unexpected messages format:', typeof rawMessages, rawMessages);
    return [];
  } catch (error) {
    console.error('Error parsing messages:', error);
    return [];
  }
};

// Mapping function for Airtable records
const mapAirtableToConversation = (record: any): Conversation => {
  if (!record) {
    console.warn('Record is null or undefined');
    return getEmptyConversation();
  }

  if (!record.fields) {
    console.warn('Record fields are missing:', record);
    return {
      ...getEmptyConversation(),
      id: record.id || ''
    };
  }

  try {
    const fields = record.fields;
    const properties = fields.Properties || fields.Property || [];
    let propertyId = '';
    
    // Déterminer le propertyId
    if (Array.isArray(properties) && properties.length > 0) {
      propertyId = properties[0];
    } else if (typeof properties === 'string') {
      propertyId = properties;
    }

    // Gérer les messages
    let messagesStr = fields.Messages;
    if (Array.isArray(messagesStr)) {
      console.log('Messages is an array, converting to string:', messagesStr);
      messagesStr = JSON.stringify(messagesStr);
    } else if (!messagesStr || typeof messagesStr !== 'string') {
      console.log('Invalid messages format, using empty array');
      messagesStr = '[]';
    }
    
    // Parser les messages
    let messages = [];
    try {
      messages = parseMessages(messagesStr);
      console.log('Parsed messages:', messages.length);
    } catch (error) {
      console.error('Error parsing messages:', error);
      messages = [];
    }

    // Construire l'objet conversation
    return {
      id: record.id,
      propertyId,
      Properties: Array.isArray(properties) ? properties : [propertyId],
      'Guest Name': fields['Guest Name'] || fields['GuestName'] || '',
      'Guest Email': fields['Guest Email'] || fields['GuestEmail'] || '',
      'Guest phone number': fields['Guest phone number'] || fields['GuestPhoneNumber'] || '',
      Messages: messagesStr,
      messages,
      'Check-in Date': fields['Check-in Date'] || fields['CheckInDate'] || '',
      'Check-out Date': fields['Check-out Date'] || fields['CheckOutDate'] || '',
      'Auto Pilot': fields['Auto Pilot'] || fields['AutoPilot'] || false,
      UnreadCount: typeof fields.UnreadCount === 'number' ? fields.UnreadCount : 0,
      fields
    };
  } catch (error) {
    console.error('Error mapping conversation:', error, record);
    return getEmptyConversation(record.id);
  }
};

// Helper function to create an empty conversation
const getEmptyConversation = (id: string = ''): Conversation => ({
  id,
  propertyId: '',
  Properties: [],
  'Guest Name': '',
  'Guest Email': '',
  'Guest phone number': '',
  Messages: '[]',
  messages: [],
  'Check-in Date': '',
  'Check-out Date': '',
  'Auto Pilot': false,
  UnreadCount: 0,
  fields: {}
});

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

  async fetchConversationById(userId: string, conversationId: string): Promise<Conversation> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!conversationId) throw new Error('Conversation ID is required');
      if (!userId) throw new Error('User ID is required');

      console.log('Fetching conversation:', conversationId);
      const record = await base('Conversations').find(conversationId);
      
      if (!record) {
        throw new Error(`Conversation not found: ${conversationId}`);
      }

      const conversation = mapAirtableToConversation(record);
      
      // Récupérer le propertyId depuis les champs Airtable
      const propertyId = record.get('Property')?.[0] || record.get('Properties')?.[0];
      if (!propertyId) {
        console.error('No property ID found for conversation:', conversationId);
        throw new Error('No property ID found for conversation');
      }
      
      console.log('[Conversation] Checking access to property:', propertyId, 'for user:', userId);
      const hasAccess = await authorizationService.canAccessProperty(userId, propertyId);
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
      const conversation = await this.fetchConversationById(user.id, conversationId);
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
