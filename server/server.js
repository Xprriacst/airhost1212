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

// Cache des messages reçus pour éviter les doublons
const recentMessages = new Map();
const MESSAGE_TTL = 5000; // 5 secondes

// File d'attente pour les notifications en échec
const notificationQueue = new Map();
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // Délais croissants entre les tentatives

// Nettoyage périodique des caches
setInterval(() => {
  const now = Date.now();
  
  // Nettoyage des notifications
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > NOTIFICATION_TTL) {
      recentNotifications.delete(key);
    }
  }
  
  // Nettoyage des messages
  for (const [key, timestamp] of recentMessages.entries()) {
    if (now - timestamp > MESSAGE_TTL) {
      recentMessages.delete(key);
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

// Stockage des souscriptions avec TTL
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

// Fonction pour retenter l'envoi d'une notification
async function retryNotification(subscription, payload, retryCount = 0) {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    if (error.statusCode === 410) {
      // Souscription expirée, on la supprime
      subscriptions.delete(subscription.endpoint);
      return false;
    }

    if (retryCount < MAX_RETRIES) {
      // Planifier une nouvelle tentative avec un délai croissant
      const delay = RETRY_DELAYS[retryCount];
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryNotification(subscription, payload, retryCount + 1);
    }

    return false;
  }
}

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    subscriptions: subscriptions.size,
    queueSize: notificationQueue.size,
    uptime: process.uptime()
  });
});

// Route de réception des messages
app.post('/receive-message', async (req, res) => {
  console.log('📨 Message received:', req.body);
  
  try {
    const { propertyId, message, guestPhone, webhookId } = req.body;

    // Validation des données requises
    if (!propertyId || !message || !guestPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Vérifier les doublons si un webhookId est fourni
    if (webhookId) {
      if (recentMessages.has(webhookId)) {
        console.log('⚠️ Duplicate message detected, skipping');
        return res.status(200).json({ 
          status: 'success',
          skipped: true,
          reason: 'duplicate_message'
        });
      }
      recentMessages.set(webhookId, Date.now());
    }

    // Formater le numéro de téléphone
    const formattedPhone = guestPhone
      .replace(/^\+/, '')     // Supprimer le + initial
      .replace(/\D/g, '')     // Supprimer tous les caractères non numériques
      .replace(/^0/, '')      // Supprimer le 0 initial
      .replace(/^33/, '')     // Supprimer le 33 initial
      .replace(/^/, '33');    // Ajouter 33 au début

    // Préparer la notification
    const payload = JSON.stringify({
      title: 'Nouveau message',
      body: message,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: Date.now(),
      data: { 
        url: '/',
        propertyId,
        guestPhone: formattedPhone,
        messageId: webhookId
      }
    });

    // Envoyer la notification à tous les abonnés
    const results = await Promise.allSettled(
      Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
        try {
          const success = await retryNotification(subscription, payload);
          return { success, endpoint };
        } catch (error) {
          return { success: false, endpoint, error: error.message };
        }
      })
    );

    // Analyser les résultats
    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    // Si certains envois ont échoué, les ajouter à la file d'attente
    if (failed > 0) {
      const retryKey = `${Date.now()}-${webhookId || Math.random()}`;
      notificationQueue.set(retryKey, {
        payload,
        retryCount: 0,
        timestamp: Date.now()
      });
    }

    console.log('✅ Message processed:', {
      total: subscriptions.size,
      succeeded,
      failed,
      queued: notificationQueue.size
    });

    res.status(200).json({
      success: true,
      sent: succeeded,
      failed,
      queued: notificationQueue.size
    });

  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({ error: 'Message processing failed' });
  }
});

// Route d'abonnement améliorée
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Vérifier si la souscription est valide
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: 'Test de connexion',
          body: 'Vérification de la souscription',
          silent: true
        })
      );
    } catch (error) {
      if (error.statusCode === 410) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }
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

// Traitement périodique de la file d'attente
setInterval(async () => {
  for (const [key, notification] of notificationQueue.entries()) {
    const { payload, retryCount, timestamp } = notification;
    
    // Vérifier si la notification n'est pas trop vieille (max 1h)
    if (Date.now() - timestamp > 3600000) {
      notificationQueue.delete(key);
      continue;
    }

    // Retenter l'envoi pour toutes les souscriptions
    const results = await Promise.allSettled(
      Array.from(subscriptions.entries()).map(async ([endpoint, { subscription }]) => {
        try {
          const success = await retryNotification(subscription, payload);
          return { success, endpoint };
        } catch (error) {
          return { success: false, endpoint, error: error.message };
        }
      })
    );

    // Si tous les envois ont réussi ou nombre max de tentatives atteint
    if (results.every(r => r.status === 'fulfilled' && r.value.success) || retryCount >= MAX_RETRIES) {
      notificationQueue.delete(key);
    } else {
      // Incrémenter le compteur de tentatives
      notificationQueue.set(key, {
        ...notification,
        retryCount: retryCount + 1
      });
    }
  }
}, 30000); // Vérifier toutes les 30 secondes

app.listen(port, () => {
  console.log(`
🚀 Server running on port ${port}
🌍 Environment: ${process.env.NODE_ENV}
🔒 CORS: ${JSON.stringify(corsOptions.origin)}
  `);
});
