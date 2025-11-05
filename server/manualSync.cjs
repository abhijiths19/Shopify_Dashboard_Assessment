// server/manualSync.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const mongoose = require('mongoose');
const { fetchOrdersAndSave } = require('./shopifySync.cjs');
const { connectDB } = require('./db.cjs');

async function run() {
  const shop = process.argv[2]; // e.g. pokestoredev-2.myshopify.com
  if (!shop) {
    console.error('❌ Usage: node server/manualSync.cjs <shop-domain>');
    process.exit(1);
  }

  console.log(`\n🔄 Starting manual sync for ${shop}...`);
  console.log('Connecting to MongoDB...');

  await connectDB();

  console.log('Connected! Fetching orders from Shopify...');
  try {
    await fetchOrdersAndSave(shop);
    console.log('✅ Manual sync completed successfully!');
  } catch (err) {
    console.error('❌ Manual sync failed:', err?.response?.data || err.message);
  } finally {
    mongoose.connection.close();
    console.log('🔚 MongoDB connection closed.');
  }
}

run();
