import { logger } from '../components/DebugLogger';

declare global {
  interface Window {
    Notification: typeof Notification;
    ServiceWorkerRegistration: typeof ServiceWorkerRegistration;
    ServiceWorker: typeof ServiceWorker;
  }
}

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
      logger.log('Checking environment variables...');
      logger.log('API URL:', process.env.REACT_APP_API_URL);
      logger.log('VAPID key exists:', !!process.env.REACT_APP_VAPID_PUBLIC_KEY);
      
      if (!process.env.REACT_APP_VAPID_PUBLIC_KEY || !process.env.REACT_APP_API_URL) {
        logger.log('Missing environment variables', 'error');
        return false;
      }
      logger.log('Environment variables are valid.');

      // Vérifier si le navigateur supporte les notifications
      logger.log('Checking browser capabilities...');
      logger.log('Service Worker support:', 'serviceWorker' in navigator);
      logger.log('Push Manager support:', 'PushManager' in window);
      
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        logger.log('Push notifications are not supported', 'warning');
        return false;
      }
      logger.log('Push notifications are supported');

      // Demander la permission pour les notifications
      const permissionGranted = await this.requestPermission();
      if (!permissionGranted) {
        logger.log('Failed to get notification permission');
        return false;
      }

      // Désinscrire tous les service workers existants
      logger.log('Unregistering existing service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        await registration.unregister();
      }
      logger.log('All service workers unregistered');

      // Enregistrer le service worker
      logger.log('Registering service worker...');
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      logger.log('Service Worker registration:', registration);
      
      // Attendre que le service worker soit activé
      if (registration.installing) {
        logger.log('Waiting for service worker to be installed...');
        await new Promise<void>((resolve) => {
          registration.installing?.addEventListener('statechange', (e) => {
            if ((e.target as ServiceWorker).state === 'activated') {
              resolve();
            }
          });
        });
      }
      
      this.swRegistration = registration;
      this.isInitialized = true;
      logger.log('Service Worker registered and activated successfully');

      // S'abonner aux notifications push immédiatement
      const subscribed = await this.subscribeToPush();
      if (!subscribed) {
        logger.log('Failed to subscribe to push notifications', 'warning');
        return false;
      }

      return true;
    } catch (error) {
      logger.log(`Failed to initialize: ${error}`, 'error');
      logger.log('Error stack:', error.stack);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      logger.log('Requesting notification permission...');
      
      // Vérifier si les notifications sont déjà bloquées
      if (Notification.permission === 'denied') {
        logger.log('Notifications are blocked. Please enable them in your browser settings.', 'warning');
        // Afficher un message à l'utilisateur avec les instructions pour débloquer
        alert('Les notifications sont bloquées. Pour les activer :\n\n' +
              '1. Cliquez sur l\'icône de cadenas/info à gauche de la barre d\'adresse\n' +
              '2. Trouvez le paramètre "Notifications"\n' +
              '3. Changez-le de "Bloquer" à "Autoriser"\n' +
              '4. Rafraîchissez la page');
        return false;
      }

      // Si la permission n'est pas encore accordée, la demander
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        logger.log('Permission response:', permission);
        
        if (permission !== 'granted') {
          logger.log('Notification permission was not granted', 'warning');
          return false;
        }
      }

      logger.log('Notification permission granted');
      return true;
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

    // Si on a déjà une souscription valide, on la réutilise
    if (subscription) {
      logger.log('Found existing subscription, reusing it');
      
      try {
        const response = await fetch(`${this.apiUrl}/subscribe`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: subscription.toJSON(), // Convertir en JSON
            timestamp: Date.now()
          }),
          credentials: 'include' // Ajouter cette ligne
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }
        
        logger.log('Successfully reused existing subscription');
        return true;
      } catch (error) {
        logger.log('Failed to send existing subscription to server:', error);
        await subscription.unsubscribe();
      }
    }

    // Créer une nouvelle souscription
    logger.log('Creating new subscription...');
    const vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      logger.log('Missing VAPID public key', 'error');
      return false;
    }

    const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);
    
    subscription = await this.swRegistration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // Envoyer la souscription au serveur
    const response = await fetch(`${this.apiUrl}/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        timestamp: Date.now()
      }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
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
