/* eslint-disable no-restricted-globals */
console.log('Service Worker Loaded');

self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  try {
    const data = event.data.json();
    console.log('Notification data:', data);
    
    const options = {
      body: data.body,
      icon: data.icon || '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
        .then(() => console.log('Notification shown successfully'))
        .catch(error => console.error('Error showing notification:', error))
    );
  } catch (error) {
    console.error('Error processing push event:', error);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
