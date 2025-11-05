// server/index.cjs
/**
 * Main server entry
 * - mounts /api/orders, /api/sync, /api/analytics
 * - exposes POST /api/on_session_created (protected by SYNC_SECRET if set)
 *
 * Copy this file to server/index.cjs
 */

require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// enable CORS for dev (you can restrict later for production)
app.use(cors({ origin: true, credentials: true }));

// === MongoDB connect ===
const mongoose = require('mongoose');
const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI not set in .env - aborting');
    process.exit(1);
  }
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
};

// === Mount existing routes (orders/sync/analytics) ===
try {
  const ordersRoute = require('./routes/orders.cjs');
  app.use('/api/orders', ordersRoute);
  console.log('✅ /api/orders route mounted');
} catch (err) {
  console.warn('⚠️ Could not mount /api/orders route:', err.message || err);
}

try {
  const syncRoute = require('./routes/sync.cjs');
  app.use('/api/sync', syncRoute);
  console.log('✅ /api/sync route mounted');
} catch (err) {
  console.warn('⚠️ Could not mount /api/sync route:', err.message || err);
}

try {
  const analyticsRoute = require('./routes/analytics.cjs');
  app.use('/api/analytics', analyticsRoute);
  console.log('✅ /api/analytics route mounted');
} catch (err) {
  console.warn('⚠️ Could not mount /api/analytics route:', err.message || err);
}

// health
app.get('/', (req, res) => res.send('🟢 Shopify Dashboard Backend'));

// === onSessionCreated helper endpoint (protected) ===
const { onSessionCreated } = require('./onSessionCreated.cjs');

function requireSyncSecret(req, res, next) {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return next();
  const header = req.headers['x-sync-secret'] || req.headers['x-shopify-sync-secret'] || '';
  if (header !== secret) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
}

/**
 * POST /api/on_session_created
 * Body: { shop: 'shop.myshopify.com', accessToken?: 'shpat_...' }
 * Protected by SYNC_SECRET header if you supply SYNC_SECRET in .env
 *
 * Use this endpoint if you want a simple HTTP hook from your OAuth callback.
 * Better: call onSessionCreated(session) directly inside your OAuth code.
 */
app.post('/api/on_session_created', requireSyncSecret, async (req, res) => {
  const body = req.body || {};
  const shop = body.shop || req.query.shop;
  const accessToken = body.accessToken || body.access_token || null;

  if (!shop) {
    return res.status(400).json({ success: false, message: 'Missing shop in body or query' });
  }

  try {
    const result = await onSessionCreated({ shop, accessToken });
    return res.json({ success: true, result });
  } catch (err) {
    console.error('POST /api/on_session_created error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err && err.message ? err.message : 'server error' });
  }
});

// === Start server ===
const PORT = parseInt(process.env.PORT, 10) || 8081;

(async () => {
  console.log('🚀 Bootstrapping server...');
  await connectDB();
  app.listen(PORT, () => {
    console.log(`✅ Server listening on http://localhost:${PORT}`);
    console.log('🧭 Test routes:');
    console.log(` - GET http://localhost:${PORT}/api/orders`);
    console.log(` - POST http://localhost:${PORT}/api/sync  { shop }`);
    console.log(` - POST http://localhost:${PORT}/api/on_session_created  { shop, accessToken }`);
  });
})();
