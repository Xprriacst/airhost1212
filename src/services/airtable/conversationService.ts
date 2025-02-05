import { base } from './config';
import { handleServiceError } from '../../utils/error';
import axios from 'axios';
import type { Conversation, Message, EmergencyTag } from '../../types';
import { authService, authorizationService } from '..';

const parseMessages = (rawMessages: any): Message[] => {
  try {
    console.log('🔍 Analyse des messages bruts:', {
      type: typeof rawMessages,
      value: rawMessages
    });

    if (!rawMessages) {
      console.log('ℹ️ Aucun message trouvé, retour tableau vide');
      return [];
    }
    
    // Si c'est déjà un tableau, on traite directement les messages
    if (Array.isArray(rawMessages)) {
      console.log(`📦 Traitement d'un tableau de ${rawMessages.length} messages`);
      return rawMessages
        .filter(msg => {
          const isValid = msg && typeof msg === 'object';
          if (!isValid) {
            console.warn('⚠️ Message invalide ignoré:', msg);
          }
          // Pour les templates, le contenu peut être vide
          if (msg.type === 'template' && !msg.text && !msg.content) {
            return isValid;
          }
          return isValid;
        })
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
        if (!cleanedString) {
          console.log('ℹ️ Chaîne vide, retour tableau vide');
          return [];
        }
        
        // Si la chaîne commence par '[', c'est probablement un tableau JSON
        if (cleanedString.startsWith('[')) {
          console.log('📝 Tentative de parsing JSON tableau');
          const parsed = JSON.parse(cleanedString);
          if (Array.isArray(parsed)) {
            return parseMessages(parsed);
          }
        }
        
        console.log('📝 Traitement comme message unique');
        return [{
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: cleanedString,
          timestamp: new Date(),
          sender: 'guest',
          type: 'text',
          status: 'sent',
          metadata: {}
        }];
      } catch (error) {
        console.error('❌ Erreur de parsing JSON:', error);
        return [];
      }
    }

    console.warn('⚠️ Format de messages non reconnu:', typeof rawMessages);
    return [];
  } catch (error) {
    console.error('❌ Erreur dans parseMessages:', error);
    return [];
  }
};

// Mapping function for Airtable records
const mapAirtableToConversation = (record: any): Conversation => {
  if (!record) {
    console.warn('⚠️ Record est null ou undefined');
    return getEmptyConversation();
  }

  if (!record.fields) {
    console.warn('⚠️ Champs du record manquants:', record);
    return {
      ...getEmptyConversation(),
      id: record.id || ''
    };
  }

  try {
    const fields = record.fields;
    
    // Validation des champs requis
    const guestPhone = fields['Guest phone number'] || fields['GuestPhone'] || fields['guestPhone'];
    if (!guestPhone) {
      console.warn('⚠️ Numéro de téléphone manquant pour la conversation:', record.id);
    }
    
    if (!fields.Properties && !fields.Property) {
      console.warn('⚠️ Propriété manquante pour la conversation:', record.id);
    }

    const properties = fields.Properties || fields.Property || [];
    let propertyId = '';
    
    // Déterminer le propertyId
    if (Array.isArray(properties) && properties.length > 0) {
      propertyId = properties[0];
    } else if (typeof properties === 'string') {
      propertyId = properties;
    }
    
    // S'assurer que properties est toujours un tableau
    const propertiesArray = Array.isArray(properties) ? properties : [propertyId];

    // Gérer les messages
    let messagesStr = fields.Messages;
    if (Array.isArray(messagesStr)) {
      console.log('📦 Messages est un tableau, conversion en chaîne:', messagesStr);
      messagesStr = JSON.stringify(messagesStr);
    } else if (!messagesStr || typeof messagesStr !== 'string') {
      console.log('ℹ️ Format de messages invalide, utilisation tableau vide');
      messagesStr = '[]';
    }
    
    // Parser les messages
    let messages = [];
    try {
      messages = parseMessages(messagesStr);
      console.log(`✅ Messages parsés: ${messages.length}`);
    } catch (error) {
      console.error('❌ Erreur lors du parsing des messages:', error);
      messages = [];
    }

    // Récupérer le nom du guest (plusieurs champs possibles)
    console.log('🔍 Champs disponibles pour le nom:', {
      'Guest Name': fields['Guest Name'],
      'Guest name': fields['Guest name'],
      'GuestName': fields['GuestName'],
      'guestName': fields['guestName'],
      'Name': fields['Name']
    });

    // Retourner l'objet conversation avec les champs originaux d'Airtable
    return {
      id: record.id || '',
      propertyId,
      Properties: propertiesArray,
      'Guest Name': fields['Guest Name'] || fields['GuestName'] || '',
      'Guest Email': fields['Guest Email'] || fields['GuestEmail'] || '',
      'Guest phone number': fields['Guest phone number'] || fields['GuestPhoneNumber'] || fields['GuestPhone'] || fields['guestPhone'] || '',
      guestPhone: fields['Guest phone number'] || fields['GuestPhoneNumber'] || fields['GuestPhone'] || fields['guestPhone'] || '',
      Messages: messagesStr,
      messages,
      'Check-in Date': fields['Check-in Date'] || fields['CheckInDate'] || '',
      'Check-out Date': fields['Check-out Date'] || fields['CheckOutDate'] || '',
      'Auto Pilot': fields['Auto Pilot'] || false,
      UnreadCount: fields['UnreadCount'] || 0
    };
  } catch (error) {
    console.error('❌ Erreur dans mapAirtableToConversation:', error);
    return {
      ...getEmptyConversation(),
      id: record.id || ''
    };
  }
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

const sendMessage = async (userId: string, conversation: Conversation, message: Message): Promise<void> => {
  try {
    // Validation du numéro de téléphone
    if (!conversation.guestPhone) {
      console.error('❌ Numéro de téléphone manquant pour la conversation:', conversation.id);
      throw new Error('Numéro de téléphone du destinataire manquant');
    }

    // Validation de la propriété
    if (!conversation.propertyId) {
      console.error('❌ ID de propriété manquant pour la conversation:', conversation.id);
      throw new Error('ID de propriété manquant');
    }

    const updatedMessages = [...conversation.messages, message];
    await conversationService.updateConversation(conversation.id, { 
      Messages: JSON.stringify(updatedMessages)
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    throw error;
  }
};

export const conversationService = {
  sendMessage,
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

  async fetchPropertyConversations(propertyId: string, guestEmail?: string): Promise<Conversation[]> {
    try {
      if (!base) throw new Error('Airtable is not configured');
      if (!propertyId) throw new Error('Property ID is required');

      const user = authService.getCurrentUser();
      if (!user) throw new Error('User not authenticated');

      console.log('Fetching conversations for property:', propertyId);
      const formula = guestEmail 
        ? `AND({PropertyId} = '${propertyId}', {GuestEmail} = '${guestEmail}')`
        : `{PropertyId} = '${propertyId}'`;

      const records = await base('Conversations')
        .select({
          filterByFormula: formula,
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
        try {
          // Vérifier si les messages sont déjà un tableau
          let messages = Array.isArray(data.Messages) ? data.Messages : JSON.parse(data.Messages);
          
          // S'assurer que c'est un tableau
          if (!Array.isArray(messages)) {
            console.warn('Format de messages invalide, conversion en tableau vide');
            messages = [];
          }
          
          // Valider et nettoyer chaque message
          messages = messages.filter(msg => {
            const isValid = msg && typeof msg === 'object' && 
              (typeof msg.text === 'string' || typeof msg.content === 'string') &&
              typeof msg.sender === 'string';
            
            if (!isValid) {
              console.warn('Message invalide ignoré:', msg);
            }
            return isValid;
          }).map(msg => ({
            id: msg.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: msg.text || msg.content || '',
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            sender: (msg.sender || '').toLowerCase() === 'host' ? 'host' : 'guest',
            type: msg.type || 'text',
            status: msg.status || 'sent',
            metadata: msg.metadata || {}
          }));

          formattedData.Messages = JSON.stringify(messages);

          if (messages.length > 0) {
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
        } catch (error) {
          console.error('Erreur lors du traitement des messages:', error);
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

  async getConversationWithoutAuth(conversationId: string): Promise<Conversation> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const record = await base('Conversations').find(conversationId);
      return mapAirtableToConversation(record);
    } catch (error) {
      console.error('Error getting conversation:', error);
      throw error;
    }
  },

  async getPropertyConversationsWithoutAuth(propertyId: string): Promise<Conversation[]> {
    try {
      if (!base) {
        throw new Error('Airtable is not configured');
      }

      const records = await base('Conversations').select({
        filterByFormula: `FIND("${propertyId}", ARRAYJOIN(Properties, ",")) > 0`,
        view: 'Grid view'
      }).all();

      return records.map(mapAirtableToConversation);
    } catch (error) {
      console.error('Error getting property conversations:', error);
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
        'UnreadCount': 0,
        'GuestEmail': data.GuestEmail || '',
        'GuestName': data.GuestName || 'Invité'
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
  UnreadCount: 0
});
