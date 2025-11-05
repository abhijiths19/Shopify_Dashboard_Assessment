// server/models/Order.js
const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
  url: { type: String }
}, { _id: false });

const LineItemSchema = new mongoose.Schema({
  lineItemId: { type: String, required: true },
  title: String,
  sku: String,
  qty: { type: Number, default: 0 },
  price: String,
  images: [ImageSchema]
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  shop: { type: String, required: true, index: true },
  orderId: { type: String, required: true, unique: true },
  status: String,
  totalPrice: String,
  currency: String,
  createdAt: { type: Date, required: true },
  lineItems: [LineItemSchema],
  raw: { type: mongoose.Schema.Types.Mixed },
  createdAtDB: { type: Date, default: Date.now }
});

// Create compound index for queries by shop + createdAt if desired
OrderSchema.index({ shop: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
