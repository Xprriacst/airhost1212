export interface WhatsAppUserConfig {
  phoneNumberId: string;
  appId: string;
  accessToken: string;
  displayName: string;
  businessId: string;
  status: 'active' | 'pending' | 'inactive';
}

export interface WhatsAppConfig {
  apiVersion: string;
  apiUrl: string;
  verifyToken: string;
}

// Configuration globale de l'API WhatsApp
export const whatsappConfig: WhatsAppConfig = {
  apiVersion: process.env.VITE_WHATSAPP_API_VERSION || 'v18.0',
  apiUrl: 'https://graph.facebook.com',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'airhost_whatsapp_webhook_123'
};

// Constantes pour la validation
export const WHATSAPP_CONFIG_CONSTRAINTS = {
  PHONE_NUMBER_ID_MIN_LENGTH: 10,
  APP_ID_MIN_LENGTH: 5,
  ACCESS_TOKEN_MIN_LENGTH: 20,
  VERIFY_TOKEN_MIN_LENGTH: 10,
  DISPLAY_NAME_MIN_LENGTH: 3,
  BUSINESS_ID_MIN_LENGTH: 5
};

// Fonction de validation de la configuration utilisateur
export function validateUserWhatsAppConfig(config: Partial<WhatsAppUserConfig>): string[] {
  const errors: string[] = [];

  if (!config.phoneNumberId || config.phoneNumberId.length < WHATSAPP_CONFIG_CONSTRAINTS.PHONE_NUMBER_ID_MIN_LENGTH) {
    errors.push('Phone Number ID invalide');
  }

  if (!config.appId || config.appId.length < WHATSAPP_CONFIG_CONSTRAINTS.APP_ID_MIN_LENGTH) {
    errors.push('App ID invalide');
  }

  if (!config.accessToken || config.accessToken.length < WHATSAPP_CONFIG_CONSTRAINTS.ACCESS_TOKEN_MIN_LENGTH) {
    errors.push('Access Token invalide');
  }



  if (!config.displayName || config.displayName.length < WHATSAPP_CONFIG_CONSTRAINTS.DISPLAY_NAME_MIN_LENGTH) {
    errors.push('Nom d\'affichage invalide');
  }

  if (!config.businessId || config.businessId.length < WHATSAPP_CONFIG_CONSTRAINTS.BUSINESS_ID_MIN_LENGTH) {
    errors.push('Business ID invalide');
  }

  return errors;
}
