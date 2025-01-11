const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://whimsical-beignet-91329f.netlify.app'
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// Configuration des clés VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:test@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Stockage des souscriptions en mémoire
let subscriptions = new Map();

// Route de santé
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ status: 'ok' });
});

// Route pour s'abonner aux notifications
app.post('/subscribe', (req, res) => {
  try {
    console.log('Received subscription request');
    const { subscription, timestamp } = req.body;
    
    if (!subscription || !subscription.endpoint) {
      console.error('Invalid subscription data received:', subscription);
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    console.log('Subscription details:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      timestamp
    });

    // Stocker la souscription avec un timestamp
    subscriptions.set(subscription.endpoint, {
      subscription,
      timestamp
    });

    console.log(`Subscription stored. Total subscriptions: ${subscriptions.size}`);
    console.log('Current subscriptions:', Array.from(subscriptions.entries()));

    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error handling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour envoyer une notification
app.post('/notify', async (req, res) => {
  try {
    console.log('Received notification request:', req.body);

    // Vérifier les souscriptions existantes
    console.log(`Current subscriptions: ${Array.from(subscriptions.keys())}`);

    const { title, body } = req.body;
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      timestamp: Date.now()
    });

    console.log('Preparing notification:', { title, body });
    console.log(`Sending notifications to ${subscriptions.size} subscribers`);

    // Envoyer la notification à tous les abonnés
    const notificationPromises = Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
      try {
        console.log(`Sending notification to endpoint: ${endpoint}`);
        await webpush.sendNotification(subscription, payload);
        console.log(`Successfully sent notification to: ${endpoint}`);
        return { success: true, endpoint };
      } catch (error) {
        console.error(`Failed to send notification to ${endpoint}:`, error);
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log(`Removing invalid subscription: ${endpoint}`);
          subscriptions.delete(endpoint);
        }
        return { success: false, endpoint, error: error.message };
      }
    });

    const results = await Promise.all(notificationPromises);
    console.log('Notification results:', results);

    res.json({ message: 'Notifications sent', results });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: 'Failed to send notifications' });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('CORS origin:', process.env.NODE_ENV === 'production' 
    ? 'https://whimsical-beignet-91329f.netlify.app'
    : 'http://localhost:3000'
  );
});
