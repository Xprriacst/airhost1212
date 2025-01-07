import axios from 'axios';
import type { Message } from '../types';

const MAKE_WEBHOOK_URL = 'https://hook.eu1.make.com/4xsralayev5rom190eo4es4zgr10olpm';

export const receiveMessageService = {
  async processIncomingMessage(messageData: any): Promise<void> {
    console.group('📥 receiveMessageService.processIncomingMessage');
    try {
      console.log('Processing incoming message:', messageData);

      // Validation des données reçues
      if (!messageData?.message?._data) {
        console.error('❌ Invalid message data:', messageData);
        throw new Error('Invalid message data structure');
      }

      const { message } = messageData;
      const { _data: data } = message;

      // Préparer le payload pour Make
      const payload = {
        messageId: data.id?._serialized,
        text: data.body,
        timestamp: data.t,
        sender: data.fromMe ? 'host' : 'guest',
        notifyName: data.notifyName,
        fromMe: data.fromMe,
        chatId: data.id?.remote,
        type: data.type
      };

      // Envoyer à Make
      console.log('📤 Sending to Make:', payload);
      const response = await axios.post(MAKE_WEBHOOK_URL, payload);
      console.log('✅ Make response:', response.data);

    } catch (error) {
      console.error('❌ Error in receiveMessageService:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  },

  async markMessageAsReceived(messageId: string): Promise<void> {
    // Implémentation future pour marquer les messages comme reçus
    console.log('Message marked as received:', messageId);
  }
};
