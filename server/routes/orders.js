// server/routes/orders.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

router.get('/', async (req, res) => {
  try {
    // optional ?shop=shop.myshopify.com
    const { shop, limit = 200, page = 1 } = req.query;

    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const q = { createdAt: { $gte: sixtyDaysAgo } };
    if (shop) q.shop = shop;

    const perPage = Math.min(parseInt(limit, 10) || 200, 1000);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * perPage;

    const orders = await Order.find(q)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .lean();

    res.json({ success: true, orders });
  } catch (err) {
    console.error('GET /api/orders error', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
