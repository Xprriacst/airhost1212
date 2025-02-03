import { OfficialWhatsAppService } from '../services/whatsapp/officialService';
import { env } from '../config/env';

async function main() {
  const config = {
    provider: 'official' as const,
    appId: env.whatsapp.appId,
    accessToken: env.whatsapp.accessToken,
    apiVersion: env.whatsapp.apiVersion,
    phoneNumberId: '477925252079395',
    apiUrl: `https://graph.facebook.com/${env.whatsapp.apiVersion}`
  };

  const service = new OfficialWhatsAppService(config);

  try {
    const messageId = await service.sendMessage('33617370484', {
      type: 'text',
      text: 'Test du template hello_world'
    });
    console.log('✅ Message envoyé avec succès:', messageId);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error);
  }
}

main().catch(console.error);
