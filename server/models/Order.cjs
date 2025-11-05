// server/models/Order.cjs
const mongoose = require('mongoose');

const LineItemSchema = new mongoose.Schema({
  name: String,
  qty: Number,
  price: String,
  imageURL: String
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  shop: { type: String, index: true },
  orderId: { type: String, unique: true, index: true },
  status: String,
  total: String,
  currency: String,
  createdAt: { type: Date, index: true },
  lineItems: [LineItemSchema],
  raw: mongoose.Schema.Types.Mixed
}, { timestamps: true });

// Export the model in a safe way (reuse existing model if already compiled)
module.exports = mongoose.models && mongoose.models.Order
  ? mongoose.models.Order
  : mongoose.model('Order', OrderSchema);
