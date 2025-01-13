/* eslint-disable no-restricted-globals */
console.log('🚀 Service Worker Loading...');

// Cache des ressources statiques
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
  
  // Force l'activation immédiate
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      // Mise en cache des ressources statiques
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
  
  // Prend le contrôle immédiatement
  event.waitUntil(
    Promise.all([
      clients.claim(),
      // Nettoyage des anciens caches
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

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('📬 Push event received');
  
  try {
    // Vérifier si l'événement contient des données
    if (!event.data) {
      console.warn('⚠️ Push event has no data');
      return;
    }

    // Parser les données
    let data;
    try {
      data = event.data.json();
      console.log('📦 Push data parsed:', data);
    } catch (error) {
      console.error('❌ Failed to parse push data:', error);
      data = {
        title: 'Nouveau message',
        body: event.data.text()
      };
    }

    // Options de notification par défaut
    const defaultOptions = {
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true,
      tag: 'message',
      renotify: true,
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        }
      ],
      data: {
        url: '/',
        ...data.data
      }
    };

    // Fusionner avec les options reçues
    const options = {
      ...defaultOptions,
      body: data.body,
      timestamp: data.timestamp || Date.now(),
    };

    console.log('🔔 Showing notification:', {
      title: data.title,
      options
    });

    // Afficher la notification
    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => {
          console.log('✅ Notification shown successfully');
          // Envoyer un message à l'application
          return self.clients.matchAll()
            .then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'NOTIFICATION_SHOWN',
                  payload: data
                });
              });
            });
        })
        .catch((error) => {
          console.error('❌ Error showing notification:', error);
          throw error;
        })
    );
  } catch (error) {
    console.error('❌ Error handling push event:', error);
    console.error('Stack:', error.stack);
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event);
  
  // Fermer la notification
  event.notification.close();

  // Récupérer l'URL cible
  const targetUrl = event.notification.data?.url || '/';
  console.log('🎯 Target URL:', targetUrl);

  // Gérer le clic
  event.waitUntil(
    // Chercher les fenêtres ouvertes
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((clientList) => {
      // Chercher si une fenêtre est déjà ouverte sur l'URL cible
      const hadWindowToFocus = clientList.some((client) => {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
        return false;
      });

      // Si aucune fenêtre n'est ouverte, en ouvrir une nouvelle
      if (!hadWindowToFocus) {
        console.log('🔗 Opening new window');
        return self.clients.openWindow(targetUrl)
          .then((client) => {
            if (client) {
              return client.focus();
            }
          });
      }
    })
    .catch((error) => {
      console.error('❌ Error handling notification click:', error);
    })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('🚫 Notification closed:', event);
});
