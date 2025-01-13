const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whimsical-beignet-91329f.netlify.app', 'https://airhost1212.netlify.app']
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());

// Configuration des clés VAPID
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.error('❌ Missing VAPID keys. Push notifications will not work!');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:contact@airhost.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Stockage des souscriptions en mémoire avec TTL
const subscriptions = new Map();
const SUBSCRIPTION_TTL = 24 * 60 * 60 * 1000; // 24 heures

// Nettoyage périodique des souscriptions expirées
setInterval(() => {
  const now = Date.now();
  for (const [endpoint, data] of subscriptions.entries()) {
    if (now - data.timestamp > SUBSCRIPTION_TTL) {
      console.log(`🧹 Removing expired subscription: ${endpoint}`);
      subscriptions.delete(endpoint);
    }
  }
}, 60 * 60 * 1000); // Toutes les heures

// Route de santé
app.get('/health', (req, res) => {
  console.log('🏥 Health check requested');
  res.status(200).json({ 
    status: 'ok',
    subscriptions: subscriptions.size,
    uptime: process.uptime()
  });
});

// Route pour s'abonner aux notifications
app.post('/subscribe', async (req, res) => {
  console.log('📝 Processing subscription request...');
  
  try {
    const { subscription } = req.body;
    
    if (!subscription?.endpoint || !subscription?.keys) {
      console.error('❌ Invalid subscription data:', subscription);
      return res.status(400).json({ 
        error: 'Invalid subscription data',
        details: 'Subscription must include endpoint and keys'
      });
    }

    // Vérifier si la souscription existe déjà
    const existingSub = subscriptions.get(subscription.endpoint);
    if (existingSub) {
      console.log('🔄 Updating existing subscription');
      subscriptions.set(subscription.endpoint, {
        subscription,
        timestamp: Date.now()
      });
      return res.status(200).json({ 
        message: 'Subscription updated successfully',
        active: true
      });
    }

    // Stocker la nouvelle souscription
    console.log('✨ Storing new subscription');
    subscriptions.set(subscription.endpoint, {
      subscription,
      timestamp: Date.now()
    });

    // Envoyer une notification de test
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'Notifications activées !',
          body: 'Vous recevrez désormais les messages de vos voyageurs.',
          icon: '/logo192.png',
          timestamp: Date.now()
        })
      );
      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.warn('⚠️ Failed to send test notification:', error.message);
    }

    res.status(201).json({ 
      message: 'Subscription added successfully',
      active: true
    });
  } catch (error) {
    console.error('❌ Error handling subscription:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Route pour envoyer une notification
app.post('/notify', async (req, res) => {
  console.log('📨 Processing notification request...');
  
  try {
    const { title, body, data } = req.body;

    if (!title || !body) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: 'Title and body are required'
      });
    }

    if (subscriptions.size === 0) {
      console.warn('⚠️ No active subscriptions found');
      return res.status(200).json({ 
        message: 'No active subscriptions',
        sent: 0
      });
    }

    console.log(`📤 Sending notification to ${subscriptions.size} subscribers`);
    
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: Date.now(),
      data,
      actions: [
        {
          action: 'open',
          title: 'Ouvrir'
        }
      ]
    });

    const results = await Promise.allSettled(
      Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
        try {
          await webpush.sendNotification(subscription, payload);
          return { success: true, endpoint };
        } catch (error) {
          console.error(`❌ Failed to send to ${endpoint}:`, error.message);
          
          if (error.statusCode === 404 || error.statusCode === 410) {
            console.log(`🗑️ Removing invalid subscription: ${endpoint}`);
            subscriptions.delete(endpoint);
          }
          
          return { 
            success: false, 
            endpoint,
            error: error.message
          };
        }
      })
    );

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;

    console.log(`📊 Notification results: ${succeeded} sent, ${failed} failed`);

    res.json({ 
      message: 'Notifications processed',
      sent: succeeded,
      failed,
      results: results.map(r => r.value || r.reason)
    });
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    res.status(500).json({ 
      error: 'Failed to send notifications',
      details: error.message
    });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`
🚀 Server is running on port ${port}
🌍 Environment: ${process.env.NODE_ENV}
🔒 CORS origin: ${process.env.NODE_ENV === 'production' 
    ? ['https://whimsical-beignet-91329f.netlify.app', 'https://airhost1212.netlify.app']
    : 'http://localhost:3000'
}
📝 Active subscriptions: ${subscriptions.size}
  `);
});
