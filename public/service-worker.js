/* eslint-disable no-restricted-globals */
/* global self, caches, clients, Notification */
console.log('🚀 Service Worker Loading...');

// Configuration
const CACHE_NAME = 'airhost-static-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo192.png',
  '/manifest.json'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
    ])
  );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('✨ Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      clients.claim(),
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log(`🧹 Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
        );
      })
    ])
  );
});

// Gestion des notifications push avec meilleure gestion d'erreurs
self.addEventListener('push', (event) => {
  console.log('📬 Push event received', event);

  try {
    // Vérification des données
    if (!event.data) {
      console.warn('⚠️ Push event has no data');
      return;
    }

    // Parser les données avec gestion d'erreur
    let data;
    try {
      data = event.data.json();
      console.log('📦 Push data parsed:', data);
    } catch (parseError) {
      console.warn('⚠️ Failed to parse JSON, using text fallback');
      data = {
        title: 'Nouveau message',
        body: event.data.text(),
        timestamp: Date.now()
      };
    }

    // Validation des données minimales requises
    if (!data.title && !data.body) {
      console.error('❌ Push data missing required fields');
      return;
    }

    // Configuration complète des notifications
    const notificationOptions = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: data.timestamp || Date.now(),
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: data.tag || 'message',
      renotify: true,
      silent: false,
      data: {
        url: data.url || '/',
        ...data.data
      },
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        },
        {
          action: 'close',
          title: 'Fermer'
        }
      ]
    };

    // Afficher la notification avec gestion complète des erreurs
    event.waitUntil(
      (async () => {
        try {
          // Vérifier la permission
          if (Notification.permission !== 'granted') {
            throw new Error('Notification permission not granted');
          }

          // Afficher la notification
          await self.registration.showNotification(data.title, notificationOptions);
          console.log('✅ Notification shown successfully');

          // Notifier tous les clients
          const clients = await self.clients.matchAll();
          clients.forEach((client) => {
            client.postMessage({
              type: 'NOTIFICATION_SHOWN',
              payload: {
                title: data.title,
                body: data.body,
                timestamp: notificationOptions.timestamp
              }
            });
          });
        } catch (error) {
          console.error('❌ Failed to show notification:', error);
          throw error;
        }
      })()
    );
  } catch (error) {
    console.error('❌ Critical error in push handler:', error);
    console.error('Stack:', error.stack);
  }
});

// Gestion améliorée des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', {
    action: event.action,
    notification: event.notification
  });

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';
  console.log('🎯 Opening URL:', targetUrl);

  event.waitUntil(
    (async () => {
      try {
        // Rechercher une fenêtre existante
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });

        // Tenter de réutiliser une fenêtre existante
        for (const client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            await client.focus();
            return;
          }
        }

        // Si aucune fenêtre correspondante n'est trouvée, en ouvrir une nouvelle
        const client = await self.clients.openWindow(targetUrl);
        if (client) {
          await client.focus();
        }
      } catch (error) {
        console.error('❌ Error handling notification click:', error);
      }
    })()
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🚫 Notification closed:', {
    title: event.notification.title,
    timestamp: event.notification.timestamp
  });
});

// Gestion des erreurs non capturées
self.addEventListener('error', (event) => {
  console.error('💥 Unhandled error in service worker:', event.error);
});

// Gestion des rejets de promesse non capturés
self.addEventListener('unhandledrejection', (event) => {
  console.error('💥 Unhandled promise rejection:', event.reason);
});
