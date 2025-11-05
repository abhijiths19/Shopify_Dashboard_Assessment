// server/routes/orders.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const router = express.Router();
const Order = require('../models/Order.cjs');

router.get('/', async (req, res) => {
  try {
    const { shop, limit = 200, page = 1 } = req.query;
    const perPage = Math.min(parseInt(limit, 10) || 200, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const q = { createdAt: { $gte: sixtyDaysAgo } };
    if (shop) q.shop = shop;

    // Support both countDocuments and older count fallback
    let total;
    if (typeof Order.countDocuments === 'function') {
      total = await Order.countDocuments(q);
    } else if (typeof Order.count === 'function') {
      total = await Order.count(q);
    } else {
      // as a last resort, fetch minimal set and get length
      const tmp = await Order.find(q).select('_id').limit(100000).lean();
      total = tmp.length;
    }

    const orders = await Order.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    return res.json({
      success: true,
      meta: { total, page: Number(page), perPage },
      orders
    });
  } catch (err) {
    console.error('GET /api/orders error', err && err.stack ? err.stack : err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

module.exports = router;
