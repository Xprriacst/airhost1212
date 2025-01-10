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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
