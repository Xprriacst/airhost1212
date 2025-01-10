/* eslint-disable no-restricted-globals */
console.log('Service Worker Loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Force l'activation immédiate du service worker
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
  // Prend le contrôle de toutes les pages immédiatement
  event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push event received');
  console.log('[Service Worker] Push data:', event.data ? event.data.text() : 'no data');
  
  try {
    const data = event.data.json();
    console.log('[Service Worker] Notification data parsed:', data);
    
    const options = {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      timestamp: data.timestamp,
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        }
      ]
    };

    console.log('[Service Worker] Showing notification with options:', options);

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('[Service Worker] Notification shown successfully'))
        .catch(error => console.error('[Service Worker] Error showing notification:', error))
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push event:', error);
    console.error('[Service Worker] Error stack:', error.stack);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification clicked:', event);
  console.log('[Service Worker] Action clicked:', event.action);
  
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
      .then(() => console.log('[Service Worker] Window opened successfully'))
      .catch(error => console.error('[Service Worker] Error opening window:', error))
  );
});
