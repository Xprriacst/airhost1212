import { logger } from '../components/DebugLogger';

const convertVapidKey = (base64String: string) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'https://airhost1212-production.up.railway.app';
  }

  async init(): Promise<boolean> {
    try {
      logger.log('Initializing notification service...');
      
      // Vérifier si les variables d'environnement sont configurées
      if (!process.env.REACT_APP_VAPID_PUBLIC_KEY || !process.env.REACT_APP_API_URL) {
        logger.log('Missing environment variables', 'error');
        return false;
      }
      logger.log('Environment variables are valid.');

      // Vérifier si le navigateur supporte les notifications
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logger.log('Push notifications are not supported', 'warning');
        return false;
      }
      logger.log('Push notifications are supported');

      // Enregistrer le service worker
      logger.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      this.swRegistration = registration;
      this.isInitialized = true;
      logger.log('Service Worker registered successfully');

      return true;
    } catch (error) {
      logger.log(`Failed to initialize: ${error}`, 'error');
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      logger.log('Requesting notification permission...');
      const permission = await Notification.requestPermission();
      logger.log(`Notification permission: ${permission}`);
      return permission === 'granted';
    } catch (error) {
      logger.log(`Error requesting permission: ${error}`, 'error');
      return false;
    }
  }

  async subscribeToPush(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        logger.log('Service Worker not registered', 'error');
        return false;
      }

      logger.log('Getting push subscription...');
      let subscription = await this.swRegistration.pushManager.getSubscription();

      // Si on a déjà une souscription, on la supprime pour éviter les doublons
      if (subscription) {
        logger.log('Found existing subscription, unsubscribing...');
        await subscription.unsubscribe();
        logger.log('Successfully unsubscribed');
      }

      logger.log('Creating new subscription...');
      const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      logger.log('Successfully created new subscription');

      // Envoyer la subscription au serveur
      logger.log('Sending subscription to server...');
      const response = await fetch(`${this.apiUrl}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      logger.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      logger.log(`Failed to subscribe: ${error}`, 'error');
      return false;
    }
  }

  async sendNotification(title: string, body: string) {
    try {
      logger.log('Sending notification:', { title, body });
      
      const response = await fetch(`${this.apiUrl}/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, body })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      logger.log('Notification sent successfully');
      return true;
    } catch (error) {
      logger.log(`Error sending notification: ${error}`, 'error');
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();
