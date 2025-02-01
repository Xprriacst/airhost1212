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
    const key = `${config.provider}_${config.phoneNumberId || 'default'}`;
    
    // Vérifier si un service existe déjà pour cette configuration
    const existingService = this.services.get(key);
    if (existingService) {
      return existingService;
    }

    // Créer une nouvelle instance du service selon le provider
    let service: IWhatsAppService;
    
    switch (config.provider) {
      case 'make':
        service = new MakeWhatsAppService();
        break;
      case 'official':
        if (!config.phoneNumberId) {
          throw new Error('Phone Number ID requis pour le provider officiel');
        }
        service = new OfficialWhatsAppService(config as WhatsAppConfig);
        break;
      default:
        throw new Error(`Provider WhatsApp non supporté: ${config.provider}`);
    }

    // Stocker le service dans la Map
    this.services.set(key, service);
    return service;
  }
}

// Export d'une fonction helper pour faciliter l'utilisation
export const getWhatsAppService = (config: WhatsAppServiceConfig): IWhatsAppService => {
  return WhatsAppServiceFactory.getInstance().getService(config);
};
