// server/db.js
require('dotenv').config();
const mongoose = require('mongoose');

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI not set in .env');

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  console.log('Connected to MongoDB');
}

module.exports = { connectDB, mongoose };
