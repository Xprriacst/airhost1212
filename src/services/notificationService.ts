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
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || 'https://airhost1212-production.up.railway.app';
  }

  async init() {
    try {
      console.log('Initializing notification service...');
      
      if (!('serviceWorker' in navigator)) {
        console.error('Service Worker not supported');
        return false;
      }

      if (!('Notification' in window)) {
        console.error('Notifications not supported');
        return false;
      }

      // Register Service Worker
      console.log('Registering service worker...');
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered:', this.swRegistration);

      // Check notification permission
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      
      if (permission === 'granted') {
        await this.subscribeToNotifications();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async subscribeToNotifications() {
    try {
      console.log('Subscribing to notifications...');
      
      if (!this.swRegistration) {
        throw new Error('Service Worker registration not found');
      }

      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      console.log('Push subscription:', subscription);

      // Send subscription to server
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

      console.log('Subscription sent to server successfully');
      return true;
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
      return false;
    }
  }

  async sendNotification(title: string, body: string) {
    try {
      console.log('Sending notification:', { title, body });
      
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

      console.log('Notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
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
