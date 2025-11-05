// server/index.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { connectDB } = require('./db');

const ordersRoute = require('./routes/orders');
const webhooksRoute = require('./routes/webhooks');

const app = express();

// Keep raw body for webhooks if you verify HMAC (not implemented here)
app.use(bodyParser.json({ limit: '5mb' }));

// Basic routes
app.use('/api/orders', ordersRoute);
app.use('/webhooks', webhooksRoute);

// health
app.get('/health', (req, res) => res.send('ok'));

const PORT = process.env.PORT || 8081;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  } catch (err) {
    console.error('Failed to start', err);
    process.exit(1);
  }
})();
