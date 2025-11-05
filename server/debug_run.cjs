// server/debug_run.cjs
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const fs = require('fs');
const path = require('path');

console.log('--- DEBUG RUN START ---');
console.log('cwd:', process.cwd());

console.log('ENV keys presence:');
console.log('  SHOPIFY_API_KEY:', !!process.env.SHOPIFY_API_KEY);
console.log('  SHOPIFY_API_SECRET:', !!process.env.SHOPIFY_API_SECRET);
console.log('  ADMIN_ACCESS_TOKEN:', !!process.env.ADMIN_ACCESS_TOKEN);
console.log('  HOST:', !!process.env.HOST);
console.log('  PORT:', !!process.env.PORT);
console.log('  MONGO_URI present:', !!process.env.MONGO_URI);
if (process.env.MONGO_URI) {
  console.log('  MONGO_URI masked:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/,'//$1:***@'));
}

const expected = [
  'server/index.cjs',
  'server/manualSync.cjs',
  'server/shopifySync.cjs',
  'server/db.cjs',
  'server/models/Order.cjs',
  'server/routes/orders.cjs',
];
for (const p of expected) {
  console.log('exists:', p, fs.existsSync(path.resolve(process.cwd(), p)));
}

console.log('\n-- Attempt to require server/index.cjs (sync) --');
try {
  require('./index.cjs');
  console.log('require ./index.cjs returned without throwing synchronously.');
} catch (e) {
  console.error('SYNCHRONOUS REQUIRE ERROR:');
  console.error(e && e.stack ? e.stack : e);
}

console.log('\n-- Attempt to connect to MongoDB (5s timeout) --');
const mongoose = require('mongoose');
const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('No MONGO_URI in env; skipping Mongo connect test.');
  console.log('--- DEBUG RUN END ---');
  process.exit(1);
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('MongoDB connected successfully.');
    return mongoose.connection.close(false);
  })
  .then(() => {
    console.log('MongoDB connection closed.');
    console.log('--- DEBUG RUN END ---');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
    console.error('Full error object:', err);
    console.log('--- DEBUG RUN END ---');
    process.exit(2);
  });
