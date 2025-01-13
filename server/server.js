const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

// Configuration CORS améliorée
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://whimsical-beignet-91329f.netlify.app', 'https://airhost1212.netlify.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // Cache CORS preflight pour 24h
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '1mb' }));

// Validation des variables d'environnement
const requiredEnvVars = ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY'];
for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

// Configuration VAPID
webpush.setVapidDetails(
  'mailto:contact@airhost.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Gestion des souscriptions avec TTL
const subscriptions = new Map();
const SUBSCRIPTION_TTL = 24 * 60 * 60 * 1000; // 24h
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1h

// Nettoyage périodique amélioré
const cleanupSubscriptions = () => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [endpoint, data] of subscriptions.entries()) {
    if (now - data.timestamp > SUBSCRIPTION_TTL) {
      subscriptions.delete(endpoint);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired subscriptions`);
  }
};

setInterval(cleanupSubscriptions, CLEANUP_INTERVAL);

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Route de santé améliorée
app.get('/health', (req, res) => {
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: uptime,
    subscriptions: subscriptions.size,
    memory: {
      heapUsed: Math.round(memory.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memory.heapTotal / 1024 / 1024) + 'MB'
    }
  });
});

// Route d'abonnement améliorée
app.post('/subscribe', async (req, res) => {
  console.log('📝 New subscription request received');
  
  try {
    const { subscription } = req.body;
    
    // Validation stricte
    if (!subscription?.endpoint || !subscription?.keys?.auth || !subscription?.keys?.p256dh) {
      return res.status(400).json({
        error: 'Invalid subscription data',
        details: 'Missing required subscription fields'
      });
    }

    // Mise à jour ou création
    const existingSub = subscriptions.get(subscription.endpoint);
    const isUpdate = Boolean(existingSub);

    subscriptions.set(subscription.endpoint, {
      subscription,
      timestamp: Date.now(),
      userAgent: req.get('user-agent')
    });

    // Notification de test
    try {
      const testPayload = JSON.stringify({
        title: 'Notifications activées !',
        body: 'Vous recevrez désormais les messages de vos voyageurs.',
        icon: '/logo192.png',
        timestamp: Date.now(),
        tag: 'welcome'
      });

      await webpush.sendNotification(subscription, testPayload);
      console.log('✅ Test notification sent successfully');
    } catch (error) {
      console.warn('⚠️ Test notification failed:', error.message);
      // On continue même si la notification de test échoue
    }

    res.status(isUpdate ? 200 : 201).json({
      message: `Subscription ${isUpdate ? 'updated' : 'added'} successfully`,
      active: true
    });
  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({
      error: 'Subscription failed',
      details: error.message
    });
  }
});

// Route de notification améliorée
app.post('/notify', async (req, res) => {
  console.log('📨 New notification request');
  
  try {
    const { title, body, data = {}, tag, requireInteraction = true } = req.body;

    // Validation
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({
        error: 'Invalid notification data',
        details: 'Title and body are required and must not be empty'
      });
    }

    if (subscriptions.size === 0) {
      return res.status(200).json({
        message: 'No active subscriptions',
        sent: 0
      });
    }

    // Préparation du payload
    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: Date.now(),
      tag,
      requireInteraction,
      data: {
        url: '/',
        ...data
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
    });

    // Envoi avec gestion des erreurs améliorée
    const results = await Promise.allSettled(
      Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
        try {
          await webpush.sendNotification(subscription, payload);
          return { success: true, endpoint };
        } catch (error) {
          const isExpired = error.statusCode === 404 || error.statusCode === 410;
          
          if (isExpired) {
            subscriptions.delete(endpoint);
            console.log(`🗑️ Removed expired subscription: ${endpoint}`);
          }
          
          return {
            success: false,
            endpoint,
            error: error.message,
            expired: isExpired
          };
        }
      })
    );

    // Analyse des résultats
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length;
    const expired = results.filter(r => r.status === 'fulfilled' && r.value.expired).length;

    console.log(`📊 Notification results: ${succeeded} sent, ${failed} failed, ${expired} expired`);

    res.json({
      status: 'success',
      sent: succeeded,
      failed,
      expired,
      remaining: subscriptions.size,
      results: results.map(r => r.value || r.reason)
    });
  } catch (error) {
    console.error('❌ Notification error:', error);
    res.status(500).json({
      error: 'Notification failed',
      details: error.message
    });
  }
});

// Gestion des erreurs globale
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Démarrage du serveur
const server = app.listen(port, () => {
  console.log(`
🚀 Server is running on port ${port}
🌍 Environment: ${process.env.NODE_ENV}
🔒 CORS origins: ${JSON.stringify(corsOptions.origin)}
📝 Active subscriptions: ${subscriptions.size}
  `);
});

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
