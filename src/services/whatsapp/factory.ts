import { WhatsAppConfig } from '../../types/whatsapp';
import { MakeWhatsAppService } from './makeService';
import { OfficialWhatsAppService } from './officialService';
import { IWhatsAppService, WhatsAppProvider, WhatsAppServiceConfig } from './types';

export class WhatsAppServiceFactory {
  private static instance: WhatsAppServiceFactory;
  private services: Map<string, IWhatsAppService> = new Map();

  private constructor() {}

  static getInstance(): WhatsAppServiceFactory {
    if (!WhatsAppServiceFactory.instance) {
      WhatsAppServiceFactory.instance = new WhatsAppServiceFactory();
    }
    return WhatsAppServiceFactory.instance;
  }

  getService(config: WhatsAppServiceConfig): IWhatsAppService {
    try {
      console.log('🔧 Configuration reçue:', config);
      const key = `${config.provider}_${config.phoneNumberId || 'default'}`;
      
      // Vérifier si un service existe déjà pour cette configuration
      const existingService = this.services.get(key);
      if (existingService) {
        console.log('✅ Service existant trouvé pour la clé:', key);
        return existingService;
      }

      console.log('📝 Création d\'un nouveau service pour le provider:', config.provider);

      // Créer une nouvelle instance du service selon le provider
      let service: IWhatsAppService;
      
      switch (config.provider) {
        case 'make':
          service = new MakeWhatsAppService();
          console.log('✅ Service Make créé');
          break;
        case 'official':
          if (!config.phoneNumberId) {
            throw new Error('Phone Number ID requis pour le provider officiel');
          }
          if (!config.accessToken) {
            throw new Error('Access Token requis pour le provider officiel');
          }
          service = new OfficialWhatsAppService(config as WhatsAppConfig);
          console.log('✅ Service WhatsApp officiel créé avec phoneNumberId:', config.phoneNumberId);
          break;
        default:
          throw new Error(`Provider WhatsApp non supporté: ${config.provider}`);
      }

      // Vérifier que le service est correctement initialisé
      if (!service || typeof service.sendMessage !== 'function') {
        throw new Error('Le service WhatsApp n\'a pas été correctement initialisé');
      }

      // Stocker le service dans la Map
      this.services.set(key, service);
      console.log('✅ Service stocké avec la clé:', key);
      return service;
    } catch (error) {
      console.error('❌ Erreur lors de la création du service WhatsApp:', error);
      throw error;
    }
  }
}

// Export d'une fonction helper pour faciliter l'utilisation
export const getWhatsAppService = (config: WhatsAppServiceConfig): IWhatsAppService => {
  console.log('🔧 Initialisation du service WhatsApp avec la config:', config);
  const service = WhatsAppServiceFactory.getInstance().getService(config);
  console.log('✅ Service WhatsApp initialisé');
  return service;
};
