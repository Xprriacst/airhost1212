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
    ? 'https://airhost1212.netlify.app'  // Remplacer par votre domaine Netlify
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
  'mailto:your-email@example.com',  // Remplacer par votre email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Store subscriptions (in memory for demo, use a database in production)
const subscriptions = new Set();

// Routes
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.add(subscription);
  res.status(201).json({});
});

app.post('/send-notification', async (req, res) => {
  const { message } = req.body;
  
  const notifications = [];
  
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Nouveau message',
        body: message
      }));
    } catch (error) {
      console.error('Error sending notification:', error);
      subscriptions.delete(subscription);
    }
  }
  
  res.status(200).json({ message: 'Notifications sent' });
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
