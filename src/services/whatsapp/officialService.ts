import { MessageContent, MessageStatus, WhatsAppConfig } from '../../types/whatsapp';
import { IWhatsAppService, WebhookPayload } from './types';

export class OfficialWhatsAppService implements IWhatsAppService {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  private isWithin24Hours(lastMessageTimestamp: Date | null): boolean {
    if (!lastMessageTimestamp) return false;
    const now = new Date();
    const diff = now.getTime() - lastMessageTimestamp.getTime();
    return diff <= 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  }

  async sendMessage(to: string, content: MessageContent): Promise<string> {
    try {
      console.log('📤 Début envoi message WhatsApp (API officielle):', {
        to,
        content,
        phoneNumberId: this.config.phoneNumberId,
        apiUrl: this.config.apiUrl,
        hasTemplate: Boolean(content.metadata?.template),
        lastMessageTimestamp: content.metadata?.lastMessageTimestamp
      });

      const useTemplate = !this.isWithin24Hours(content.metadata?.lastMessageTimestamp || null);
      console.log('⏰ Vérification fenêtre 24h:', {
        useTemplate,
        lastMessageTimestamp: content.metadata?.lastMessageTimestamp,
        now: new Date()
      });

      // Validation des métadonnées pour les templates
      if (useTemplate && !content.metadata?.template) {
        console.error('❌ Template non défini dans les métadonnées');
        throw new Error('Template WhatsApp non spécifié');
      }

      let payload;
      if (useTemplate) {
        const templateName = content.metadata?.template || 'bienvenue';
        const templateLanguage = templateName === 'hello_world' ? 'en_US' : 'fr';
        
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
            },
            components: [] // Ajout du champ components même vide pour respecter le format
          }
        };
        console.log(`📤 Utilisation du template '${templateName}' car hors fenêtre de 24h`);
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { 
            body: content.content
          }
        };
        console.log('📤 Message standard dans la fenêtre de 24h');
      }
      console.log('[DEBUG] Payload complet :', JSON.stringify(payload, null, 2));
      
      const headers = {
        Authorization: `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      };
      console.log('[DEBUG] En-têtes d\'autorisation :', headers);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes de timeout

      const apiVersion = 'v21.0'; // Version fixe de l'API
      const baseUrl = 'https://graph.facebook.com';
      const response = await fetch(`${baseUrl}/${apiVersion}/${this.config.phoneNumberId}/messages`, {
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
      
      const messageId = data.messages?.[0]?.id;
      console.log('📱 Message ID:', messageId);
      
      return messageId || '';
    } catch (error) {
      console.error('Erreur lors de l\'envoi via l\'API WhatsApp:', error);
      throw error;
    }
  }

  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    try {
      const response = await fetch(`${this.config.apiUrl}/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
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
      await fetch(`${this.config.apiUrl}/${messageId}/mark_as_read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
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
