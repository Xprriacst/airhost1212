import express from 'express';
import webpush from 'web-push';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://whimsical-beignet-91329f.netlify.app'
    : 'http://localhost:3000',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// Configuration VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

webpush.setVapidDetails(
  'mailto:alexandre.errasti@gmail.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions (in memory for demo, use a database in production)
const subscriptions = new Set();

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok' });
});

// Subscribe route
app.post('/subscribe', (req, res) => {
  console.log('Received subscription request from origin:', req.headers.origin);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  const subscription = req.body;
  
  if (!subscription || !subscription.endpoint) {
    console.error('Invalid subscription object received');
    return res.status(400).json({ 
      message: 'Invalid subscription',
      received: subscription 
    });
  }

  try {
    subscriptions.add(subscription);
    console.log('Subscription added successfully');
    res.status(201).json({ message: 'Subscription added successfully' });
  } catch (error) {
    console.error('Error adding subscription:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
});

// Send notification route
app.post('/send-notification', async (req, res) => {
  console.log('Received notification request:', req.body);
  
  if (!req.body || !req.body.title || !req.body.body) {
    console.error('Invalid notification data received');
    return res.status(400).json({ message: 'Title and body are required' });
  }

  const notification = {
    title: req.body.title,
    body: req.body.body
  };

  console.log('Sending notification to', subscriptions.size, 'subscribers');
  
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/logo192.png'
  });

  console.log('Sending notifications to', subscriptions.size, 'subscribers');
  
  const notifications = Array.from(subscriptions).map(subscription => {
    return webpush.sendNotification(subscription, payload)
      .catch(error => {
        console.error('Error sending notification:', error);
        if (error.statusCode === 410) {
          console.log('Subscription expired, removing:', subscription.endpoint);
          subscriptions.delete(subscription);
        }
        return null;
      });
  });

  Promise.all(notifications)
    .then(() => {
      console.log('All notifications sent successfully');
      res.status(200).json({ message: 'Notifications sent' });
    })
    .catch(error => {
      console.error('Error in Promise.all:', error);
      res.status(500).json({ message: 'Error sending notifications' });
    });
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  // Donner un peu de temps au serveur pour démarrer
  const startupGracePeriod = 60000; // 60 secondes
  const serverUptime = process.uptime() * 1000;
  
  if (serverUptime < startupGracePeriod) {
    return res.status(200).json({
      status: 'starting',
      uptime: serverUptime,
      message: 'Server is starting up'
    });
  }

  // Vérifier les clés VAPID seulement après la période de grâce
  if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
    return res.status(503).json({ 
      status: 'error',
      message: 'VAPID keys not configured'
    });
  }

  res.status(200).json({ 
    status: 'healthy',
    uptime: serverUptime,
    timestamp: new Date().toISOString(),
    subscriptions: subscriptions.size
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
