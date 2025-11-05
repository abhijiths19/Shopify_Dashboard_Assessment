// server/routes/webhooks.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');

// Expects Shopify to POST to /webhooks/app_uninstalled
router.post('/app_uninstalled', async (req, res) => {
  try {
    const shop = req.body?.myshopify_domain || req.headers['x-shopify-shop-domain'];
    if (shop) {
      await Order.deleteMany({ shop });
      console.log(`Deleted orders for ${shop} after uninstall`);
    } else {
      console.warn('app_uninstalled received without shop info');
    }
    res.status(200).send('ok');
  } catch (err) {
    console.error('Webhook app_uninstalled error', err);
    res.status(500).send('error');
  }
});

module.exports = router;
