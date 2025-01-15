const express = require('express');
const cors = require('cors');
const webpush = require('web-push');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 8080;

// CORS Configuration
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

// Caches for deduplication
const recentNotifications = new Map();
const recentMessages = new Map();
const CACHE_TTL = 5000; // 5 seconds

// Notification retry queue
const notificationQueue = new Map();
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000];

// Subscription storage
const subscriptions = new Map();
const SUBSCRIPTION_TTL = 24 * 60 * 60 * 1000; // 24h

// Periodic cache cleanup
setInterval(() => {
  const now = Date.now();
  
  for (const [key, timestamp] of recentNotifications.entries()) {
    if (now - timestamp > CACHE_TTL) recentNotifications.delete(key);
  }
  
  for (const [key, timestamp] of recentMessages.entries()) {
    if (now - timestamp > CACHE_TTL) recentMessages.delete(key);
  }
}, 10000);

// Periodic subscription cleanup
setInterval(() => {
  const now = Date.now();
  for (const [endpoint, data] of subscriptions.entries()) {
    if (now - data.timestamp > SUBSCRIPTION_TTL) {
      subscriptions.delete(endpoint);
    }
  }
}, 60 * 60 * 1000);

// VAPID Configuration
if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  console.error('❌ Missing VAPID keys');
  process.exit(1);
}

webpush.setVapidDetails(
  'mailto:contact@airhost.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Notification retry helper
async function retryNotification(subscription, payload, retryCount = 0) {
  try {
    await webpush.sendNotification(subscription, payload);
    return true;
  } catch (error) {
    console.error(`Notification attempt ${retryCount + 1} failed:`, error.message);

    if (error.statusCode === 410) {
      subscriptions.delete(subscription.endpoint);
      return false;
    }

    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryNotification(subscription, payload, retryCount + 1);
    }

    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    subscriptions: subscriptions.size,
    queueSize: notificationQueue.size,
    uptime: process.uptime()
  });
});

// New notification endpoint
app.post('/send-notification', async (req, res) => {
  try {
    const { title, body } = req.body;
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Missing title or body' });
    }

    console.log('📨 Sending notification:', { title, body });

    const payload = JSON.stringify({
      title,
      body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      timestamp: Date.now()
    });

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

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    console.log('✅ Notification sent:', { succeeded, failed });

    res.status(200).json({
      success: true,
      sent: succeeded,
      failed
    });
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    res.status(500).json({ 
      error: 'Failed to send notification',
      details: error.message 
    });
  }
});

// Subscription endpoint
app.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;
    
    if (!subscription?.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Validate subscription
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
      console.warn('⚠️ Test notification failed:', error.message);
    }

    // Store subscription
    subscriptions.set(subscription.endpoint, {
      subscription,
      timestamp: Date.now()
    });

    console.log('✅ New subscription added:', subscription.endpoint);
    res.status(201).json({ message: 'Subscription successful' });
  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({ 
      error: 'Subscription failed',
      details: error.message 
    });
  }
});

// Message receiving endpoint
app.post('/receive-message', async (req, res) => {
  console.log('📨 Message received:', req.body);
  
  try {
    const { propertyId, message, guestPhone, webhookId } = req.body;

    if (!propertyId || !message || !guestPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Deduplication check
    if (webhookId && recentMessages.has(webhookId)) {
      return res.status(200).json({ 
        status: 'success',
        skipped: true,
        reason: 'duplicate_message'
      });
    }

    if (webhookId) {
      recentMessages.set(webhookId, Date.now());
    }

    // Format phone number
    const formattedPhone = guestPhone
      .replace(/^\+/, '')
      .replace(/\D/g, '')
      .replace(/^0/, '')
      .replace(/^33/, '')
      .replace(/^/, '33');

    // Prepare notification payload
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

    // Send to all subscribers
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

    const succeeded = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.filter(r => r.status === 'fulfilled' && !r.value.success).length;

    console.log('✅ Message processed:', {
      total: subscriptions.size,
      succeeded,
      failed
    });

    res.status(200).json({
      success: true,
      sent: succeeded,
      failed
    });

  } catch (error) {
    console.error('❌ Error processing message:', error);
    res.status(500).json({ 
      error: 'Message processing failed',
      details: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`
🚀 Server running on port ${port}
🌍 Environment: ${process.env.NODE_ENV}
🔒 CORS: ${JSON.stringify(corsOptions.origin)}
  `);
});
