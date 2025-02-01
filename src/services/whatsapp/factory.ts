import { WhatsAppConfig } from '../../types/whatsapp';
import { MakeWhatsAppService } from './makeService';
import { OfficialWhatsAppService } from './officialService';
import { IWhatsAppService, WhatsAppProvider, WhatsAppServiceConfig } from './types';

export class WhatsAppServiceFactory {
  private static instance: WhatsAppServiceFactory;
  private currentService?: IWhatsAppService;
  private currentProvider?: WhatsAppProvider;

  private constructor() {}

  static getInstance(): WhatsAppServiceFactory {
    if (!WhatsAppServiceFactory.instance) {
      WhatsAppServiceFactory.instance = new WhatsAppServiceFactory();
    }
    return WhatsAppServiceFactory.instance;
  }

  getService(config: WhatsAppServiceConfig): IWhatsAppService {
    // Si le service existe déjà et que le provider n'a pas changé, retourner l'instance existante
    if (this.currentService && this.currentProvider === config.provider) {
      return this.currentService;
    }

    // Créer une nouvelle instance du service selon le provider
    switch (config.provider) {
      case 'make':
        this.currentService = new MakeWhatsAppService();
        break;
      case 'official':
        this.currentService = new OfficialWhatsAppService(config);
        break;
      default:
        throw new Error(`Provider WhatsApp non supporté: ${config.provider}`);
    }

    this.currentProvider = config.provider;
    return this.currentService;
  }
}

// Export d'une fonction helper pour faciliter l'utilisation
export const getWhatsAppService = (config: WhatsAppServiceConfig): IWhatsAppService => {
  return WhatsAppServiceFactory.getInstance().getService(config);
};
