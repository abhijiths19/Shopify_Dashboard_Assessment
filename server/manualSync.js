// server/manualSync.js
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const { fetchAndSaveOrders } = require('./shopifySync');

async function main() {
  const shop = process.argv[2];
  if (!shop) {
    console.error('Usage: node server/manualSync.js <shop.myshopify.com>');
    process.exit(1);
  }

  const token = process.env.ADMIN_ACCESS_TOKEN;
  if (!token) {
    console.error('Please set ADMIN_ACCESS_TOKEN in your .env');
    process.exit(1);
  }

  try {
    console.log(`Starting manual sync for ${shop}`);
    const res = await fetchAndSaveOrders(shop, token);
    console.log('Manual sync completed:', res);
    process.exit(0);
  } catch (err) {
    console.error('Manual sync failed:', err);
    process.exit(2);
  }
}

main();
