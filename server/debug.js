// server/debug.js
require('dotenv').config({ path: require('path').resolve(process.cwd(), '.env') });
const path = require('path');
const fs = require('fs');

console.log('--- DEBUG START ---');
console.log('cwd:', process.cwd());
console.log('.env loaded? ', !!process.env.SHOPIFY_API_KEY);

console.log('SHOPIFY_API_KEY:', process.env.SHOPIFY_API_KEY ? process.env.SHOPIFY_API_KEY : '(missing)');
console.log('SHOPIFY_API_SECRET:', process.env.SHOPIFY_API_SECRET ? 'present' : '(missing)');
console.log('ADMIN_ACCESS_TOKEN:', process.env.ADMIN_ACCESS_TOKEN ? 'present' : '(missing)');
console.log('HOST:', process.env.HOST ? process.env.HOST : '(missing)');
console.log('PORT:', process.env.PORT || '(missing)');
console.log('MONGO_URI:', process.env.MONGO_URI ? process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/,'//$1:***@') : '(missing)');

const expectedFiles = [
  path.resolve(process.cwd(), 'server', 'index.js'),
  path.resolve(process.cwd(), 'server', 'db.js'),
  path.resolve(process.cwd(), 'server', 'shopifySync.js'),
  path.resolve(process.cwd(), 'server', 'models', 'Order.js'),
  path.resolve(process.cwd(), 'server', 'manualSync.js'),
];

for (const f of expectedFiles) {
  console.log('exists:', f, fs.existsSync(f));
}

// Test Mongo connection (5s timeout)
const mongoose = require('mongoose');

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('No MONGO_URI in env — aborting Mongo test.');
  console.log('--- DEBUG END ---');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB (5s timeout)...');
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
})
  .then(() => {
    console.log('MongoDB connected successfully.');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      console.log('--- DEBUG END ---');
      process.exit(0);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message || err);
    console.log('Full error:', err);
    console.log('--- DEBUG END ---');
    process.exit(2);
  });
