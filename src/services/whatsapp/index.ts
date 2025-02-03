export * from './types';
export * from './factory';
export * from './makeService';
export * from './officialService';

import { WhatsAppServiceConfig } from './types';
import { WhatsAppServiceFactory } from './factory';

export const getWhatsAppService = (config: WhatsAppServiceConfig) => {
  return WhatsAppServiceFactory.getInstance().getService(config);
};
