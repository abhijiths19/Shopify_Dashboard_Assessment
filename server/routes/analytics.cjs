// server/routes/analytics.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const express = require('express');
const router = express.Router();
const Order = require('../models/Order.cjs');

router.get('/', async (req, res) => {
  try {
    const { shop } = req.query;
    const sixtyDaysAgo = new Date(); sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const baseQuery = { createdAt: { $gte: sixtyDaysAgo } };
    if (shop) baseQuery.shop = shop;

    const orders = await Order.find(baseQuery).lean();
    const totalOrders = orders.length;
    const revenue = orders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
    const avgAOV = totalOrders ? revenue / totalOrders : 0;

    // group by date for chart
    const byDate = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt).toISOString().slice(0, 10);
      byDate[d] = (byDate[d] || 0) + (parseFloat(o.total) || 0);
    });

    const labels = Object.keys(byDate).sort();
    const data = labels.map(l => ({ date: l, revenue: byDate[l] }));

    res.json({
      success: true,
      meta: { totalOrders, revenue, avgAOV },
      timeseries: data
    });
  } catch (err) {
    console.error('GET /api/analytics error', err);
    res.status(500).json({ success: false, message: err.message || 'server error' });
  }
});

module.exports = router;
