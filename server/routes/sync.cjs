// server/routes/sync.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const router = express.Router();
const { fetchAllOrdersAndSave } = require('../shopifySync.cjs');

// Optional: basic auth middleware to avoid public misuse (recommended)
function requireSecret(req, res, next) {
  const secret = process.env.SYNC_SECRET || null;
  if (!secret) return next(); // allow if not set
  const header = req.headers['x-sync-secret'] || '';
  if (header !== secret) return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
}

router.post('/', requireSecret, async (req, res) => {
  try {
    const shop = req.body.shop || req.query.shop;
    if (!shop) return res.status(400).json({ success: false, message: 'Missing shop param' });

    // Kick off sync (await or run in background depending on UX)
    const result = await fetchAllOrdersAndSave(shop);
    return res.json({ success: true, result });
  } catch (err) {
    console.error('POST /api/sync error', err);
    return res.status(500).json({ success: false, message: err && err.message ? err.message : 'sync failed' });
  }
});

module.exports = router;
