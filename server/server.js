const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

// Configuration CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whimsical-beignet-91329f.netlify.app', 'https://airhost1212.netlify.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Cache des notifications récentes pour éviter les doublons
const recentNotifications = new Map();
const NOTIFICATION_TTL = 5000; // 5 secondes

// Nettoyage périodique du cache
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_TTL) {
      recentNotifications.delete(key);
    }
  }
}, 10000);

// Configuration VAPID
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('❌ Missing VAPID keys');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:contact@airhost.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Stockage des souscriptions
const subscriptions = new Map();
const SUBSCRIPTION_TTL = 24 * 60 * 60 * 1000; // 24h

// Nettoyage périodique des souscriptions
setInterval(() => {
  const now = Date.now();
  for (const [endpoint, data] of subscriptions.entries()) {
    if (now - data.timestamp > SUBSCRIPTION_TTL) {
      subscriptions.delete(endpoint);
    }
  }
}, 60 * 60 * 1000);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    subscriptions: subscriptions.size,
    uptime: process.uptime()
  });
});

// Route d'abonnement
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    subscriptions.set(subscription.endpoint, {
      subscription,
      timestamp: Date.now()
    });

    // Notification de test
    try {
      await webpush.sendNotification(subscription, JSON.stringify({
        title: 'Notifications activées !',
        body: 'Vous recevrez désormais les messages de vos voyageurs.',
        icon: '/logo192.png'
      }));
    } catch (error) {
      console.warn('⚠️ Test notification failed:', error.message);
    }

    res.status(201).json({ message: 'Subscription successful' });
  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// Route de notification améliorée
app.post('/notify', async (req, res) => {
  console.log('📨 Notification request received:', req.body);
  
  try {
    const { title, body, messageId } = req.body;

    if (!title || !body) {
      console.log('❌ Missing title or body');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier si on a déjà traité cette notification récemment
    if (messageId) {
      const key = `${messageId}`;
      if (recentNotifications.has(key)) {
        console.log('⚠️ Duplicate notification detected, still sending');
      }
      recentNotifications.set(key, Date.now());
    }

    if (subscriptions.size === 0) {
      return res.status(200).json({
        message: 'No active subscriptions',
        sent: 0
      });
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: Date.now(),
      data: { url: '/' },
      actions: [{ action: 'open', title: 'Ouvrir' }]
    });

    const results = await Promise.allSettled(
      Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
        try {
          await webpush.sendNotification(subscription, payload);
          return { success: true, endpoint };
        } catch (error) {
          if (error.statusCode === 404 || error.statusCode === 410) {
            subscriptions.delete(endpoint);
          }
          return { success: false, endpoint, error: error.message };
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;

    console.log('✅ Notification processed successfully');
    res.status(200).json({
      success: true,
      sent: succeeded,
      total: subscriptions.size
    });

  } catch (error) {
    console.error('❌ Error processing notification:', error);
    res.status(500).json({ error: 'Notification failed' });
  }
});

app.listen(port, () => {
  console.log(`
🚀 Server running on port ${port}
🌍 Environment: ${process.env.NODE_ENV}
🔒 CORS: ${JSON.stringify(corsOptions.origin)}
  `);
});
