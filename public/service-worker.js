/* eslint-disable no-restricted-globals */
console.log('Service Worker Loaded');

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated.');
});

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  console.log('Push data:', event.data ? event.data.text() : 'no data');
  
  try {
    const data = event.data.json();
    console.log('Notification data parsed:', data);
    
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

    console.log('Showing notification with options:', options);

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('Notification shown successfully'))
        .catch(error => console.error('Error showing notification:', error))
    );
  } catch (error) {
    console.error('Error processing push event:', error);
    console.error('Error stack:', error.stack);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  console.log('Action clicked:', event.action);
  
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
      .then(() => console.log('Window opened successfully'))
      .catch(error => console.error('Error opening window:', error))
  );
});
