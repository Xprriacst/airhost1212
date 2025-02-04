export interface WhatsAppUserConfig {
  phoneNumberId: string;
  appId: string;
  accessToken: string;
  verifyToken: string;
  displayName: string;
  businessId: string;
}

export interface WhatsAppConfig {
  apiVersion: string;
  apiUrl: string;
  defaultVerifyToken: string;
}

// Configuration globale de l'API WhatsApp
export const whatsappConfig: WhatsAppConfig = {
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  apiUrl: `https://graph.facebook.com/${process.env.WHATSAPP_API_VERSION || 'v18.0'}`,
  defaultVerifyToken: 'airhost_whatsapp_webhook_123'
};

// Fonction pour obtenir la configuration d'un utilisateur
export async function getUserWhatsAppConfig(userId: string): Promise<WhatsAppUserConfig | null> {
  // TODO: Récupérer la configuration depuis Airtable
  // Cette fonction sera implémentée une fois la structure Airtable mise à jour
  return null;
}
