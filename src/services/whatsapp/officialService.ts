import { MessageContent, MessageStatus, WhatsAppConfig } from '../../types/whatsapp';
import { IWhatsAppService, WebhookPayload } from './types';
import { userService } from '../airtable/userService';
import { base } from '../airtable/config';

export class OfficialWhatsAppService implements IWhatsAppService {
  private userId: string;
  private baseUrl = 'https://graph.facebook.com/v21.0';
  private phoneNumberId = '477925252079395';

  constructor(userId: string) {
    this.userId = userId;
  }

  private async getWhatsAppConfig(): Promise<{
    accessToken: string;
    phoneNumberId: string;
  }> {
    try {
      console.log('🔍 Recherche de la configuration WhatsApp pour userId:', this.userId);

      // ====== PREMIÈRE MODIFICATION (REMPLACEMENT) ======
      // Ancien code :
      //    const record = await base('Users').find(this.userId);
      //    console.log('📄 Record utilisateur trouvé:', {
      //      id: record?.id,
      //      fields: record?.fields,
      //    });
      //    if (!record) {
      //      throw new Error('Utilisateur non trouvé');
      //    }

      // Nouveau code :
      const records = await base('User Properties')
        .select({
          maxRecords: 1,
          fields: ['whatsapp_business_config']
        })
        .firstPage();

      const record = records[0];
      if (!record) {
        throw new Error('Configuration WhatsApp non trouvée');
      }
      // ====== FIN PREMIÈRE MODIFICATION ======

      const configStr = record.get('whatsapp_business_config') as string;
      console.log('📦 Configuration WhatsApp brute:', configStr);
      if (!configStr) {
        throw new Error('Configuration WhatsApp non trouvée');
      }

      const config = JSON.parse(configStr);
      console.log('✅ Configuration WhatsApp parsée:', {
        hasAccessToken: Boolean(config.access_token),
        accessTokenLength: config.access_token?.length,
        phoneNumberId: config.phone_number_id,
        allKeys: Object.keys(config)
      });
      return {
        accessToken: config.access_token,
        phoneNumberId: config.phone_number_id
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration WhatsApp:', error);
      throw error;
    }
  }

  private isWithin24Hours(lastMessageTimestamp: Date | null): boolean {
    if (!lastMessageTimestamp) return false;
    const now = new Date();
    const diff = now.getTime() - lastMessageTimestamp.getTime();
    return diff <= 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  }

  async sendMessage(to: string, content: MessageContent): Promise<string> {
    try {
      // Récupérer la configuration WhatsApp à jour
      const config = await this.getWhatsAppConfig();
      console.log('📤 Début envoi message WhatsApp (API officielle):', {
        to,
        content,
        phoneNumberId: config.phoneNumberId,
        baseUrl: this.baseUrl,
        hasTemplate: Boolean(content.metadata?.template),
        lastMessageTimestamp: content.metadata?.lastMessageTimestamp
      });

      // Déterminer si on doit utiliser un template
      const isTemplate = content.type === 'template';
      const isOutsideWindow = !this.isWithin24Hours(content.metadata?.lastMessageTimestamp || null);
      
      console.log('⏰ Vérification message:', {
        isTemplate,
        isOutsideWindow,
        messageType: content.type,
        lastMessageTimestamp: content.metadata?.lastMessageTimestamp,
        now: new Date()
      });

      // Si on est hors fenêtre de 24h, on doit utiliser un template
      if (isOutsideWindow && !isTemplate) {
        console.error('❌ Template requis hors fenêtre de 24h');
        throw new Error('Un template est requis pour les messages hors fenêtre de 24h');
      }

      // Si c'est un template, vérifier qu'il est spécifié
      if (isTemplate && !content.metadata?.template) {
        console.error('❌ Template non défini dans les métadonnées');
        throw new Error('Template WhatsApp non spécifié');
      }

      let payload;
      if (isTemplate) {
        if (!content.metadata?.template || !content.metadata?.language) {
          throw new Error('Template ou langue non spécifiés dans les métadonnées');
        }

        const templateName = content.metadata.template;
        const templateLanguage = content.metadata.language;
        
        console.log('🔧 Configuration template:', {
          templateName,
          templateLanguage,
          hasMetadata: Boolean(content.metadata),
          metadata: content.metadata
        });
        
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: templateName,
            language: {
              code: templateLanguage
            }
          }
        };
        console.log(`📤 Utilisation du template '${templateName}' car hors fenêtre de 24h`);
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { 
            body: content.content || content.text || ''
          }
        };
        console.log('📤 Message standard dans la fenêtre de 24h');
      }
      console.log('[DEBUG] Payload complet :', JSON.stringify(payload, null, 2));
      
      const headers = {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json'
      };
      console.log('[DEBUG] En-têtes d\'autorisation :', headers);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

      const apiVersion = 'v21.0'; // Version fixe de l'API
      const baseUrl = 'https://graph.facebook.com';
      const response = await fetch(`${baseUrl}/${apiVersion}/${config.phoneNumberId}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      console.log('📥 Réponse brute:', responseText);

      if (!response.ok) {
        console.error('❌ Erreur API WhatsApp:', {
          status: response.status,
          statusText: response.statusText,
          response: responseText
        });
        throw new Error(`Erreur API WhatsApp: ${response.status} ${response.statusText} - ${responseText}`);
      }

      const data = JSON.parse(responseText);
      console.log('✅ Réponse parsée:', data);
      
      // ====== DEUXIÈME MODIFICATION (REMPLACEMENT) ======
      // Ancien code :
      //    const messageId = data.messages?.[0]?.id;
      //    console.log('📱 Message ID:', messageId);
      //    
      //    return messageId || '';

      // Nouveau code :
      const messageId = data.messages?.[0]?.id;
      console.log('📱 Message ID:', messageId);
      
      // Mise à jour du statut dans Airtable
      console.log('🔍 Metadata:', content.metadata);
      const userId = content.metadata.conversationId; // L'ID utilisateur est stocké ici
      console.log('🔍 User ID utilisé:', userId);
      const conversations = await getConversationsByUserId(userId);
      if (conversations.length === 0) {
        throw new Error(`Aucune conversation trouvée pour l'utilisateur ${userId}`);
      }
      const conversation = conversations[0];
      if (!conversation?.guest?.phone || !conversation.property?.id) {
        throw new Error(`Données de conversation incomplètes pour ${userId}: ${JSON.stringify(conversation)}`);
      }

      const config = await getWhatsAppConfigByPropertyId(conversation.property.id);
      const phoneNumber = conversation.guest.phone;
      // Ajouter la gestion d'erreur ici
      if (!config) {
        throw new Error(`Configuration WhatsApp introuvable pour la propriété ${conversation.property.id}`);
      }

      console.log('Envoi template WhatsApp', {
        template: content.metadata.template,
        to: phoneNumber,
        configId: config.id
      });

      // Validation du numéro
      if (!/^\+[1-9]\d{1,14}$/.test(phoneNumber)) {
        throw new Error(`Format de numéro invalide: ${phoneNumber}`);
      }

      if (!config.accessToken || !config.phoneNumberId) {
        throw new Error('Configuration WhatsApp incomplète - token ou phoneNumberId manquant');
      }

      const messages = JSON.parse(conversation.get('Messages') || '[]');
      const updatedMessages = messages.map(msg => {
        if (msg.type === 'template' && msg.status === 'pending') {
          return { ...msg, status: 'sent', waMessageId: messageId };
        }
        return msg;
      });
      
      await base('Conversations').update(conversation.id, {
        Messages: JSON.stringify(updatedMessages)
      });
      console.log('✅ Statut du message mis à jour dans Airtable');
      
      return messageId || '';
      // ====== FIN DEUXIÈME MODIFICATION ======
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi via l\'API WhatsApp:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      const config = await this.getWhatsAppConfig();
      const response = await fetch(`${this.baseUrl}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Erreur lors de la récupération du statut: ${response.statusText}`);
      }

      const data = await response.json();
      return this.mapStatus(data.status);
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const config = await this.getWhatsAppConfig();
      await fetch(`${this.baseUrl}/${messageId}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
      });
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
      throw error;
    }
  }

  async handleWebhook(payload: WebhookPayload): Promise<void> {
    // Traitement des webhooks de l'API officielle
    console.log('Message reçu via l\'API officielle:', payload);
    // Implémentation du traitement des webhooks...
  }

  private mapStatus(apiStatus: string): MessageStatus {
    const statusMap: Record<string, MessageStatus> = {
      'sent': 'sent',
      'delivered': 'delivered',
      'read': 'read',
      'failed': 'failed',
    };
    return statusMap[apiStatus] || 'sent';
  }
}

// Fonctions supplémentaires pour la récupération des conversations et des configurations WhatsApp
async function getConversationById(conversationId: string) {
  const base = await getAirtableBase();
  const record = await base('Conversations').find(conversationId);
  
  if (!record.get('Guest Phone') || !record.get('Property ID')) {
    await base('Erreurs').create({
      'Conversation ID': conversationId,
      'Type': 'Champs manquants',
      'Date': new Date().toISOString()
    });
    throw new Error('Champs obligatoires manquants dans la conversation');
  }
  
  return {
    id: record.id,
    guest: {
      phone: record.get('Guest Phone'),
      name: record.get('Guest Name')
    },
    property: {
      id: record.get('Property ID'),
      name: record.get('Property Name')
    },
    get: (field: string) => record.get(field)
  };
}

async function getConversationsByUserId(userId: string) {
  const base = await getAirtableBase();
  const records = await base('Conversations')
    .select({ filterByFormula: `{User ID} = '${userId}'` })
    .firstPage();
  return records.map(record => ({
    id: record.id,
    guest: {
      phone: record.get('Guest Phone') || record.get('guestPhone') || record.get('Phone') || record.get('phone'),
      name: record.get('Guest Name') || record.get('guestName')
    },
    property: {
      id: record.get('Property ID') || record.get('propertyId'),
      name: record.get('Property Name') || record.get('propertyName')
    },
    get: (field: string) => record.get(field)
  }));
}

async function getWhatsAppConfigByPropertyId(propertyId: string) {
  const base = await getAirtableBase();
  const records = await base('WhatsApp Configs')
    .select({ filterByFormula: `{Property ID} = '${propertyId}'` })
    .firstPage();
  return records[0]?.fields;
}

async function getAirtableBase() {
  // Implémentation de la récupération de la base Airtable
  // ...
}
