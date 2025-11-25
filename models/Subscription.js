const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  nameplan: { type: String, required: true },
  planId: { type: String, required: true },
  subscriptionID: { type: String, default: null }, // PayPal subscription ID
  paymentType: { type: String, enum: ['subscription', 'oneTime'], required: true },
  promoCode: { type: String, default: null },
  status: { type: String, default: 'ACTIVE' }, // ACTIVE, CANCELLED, EXPIRED
  expiresAt: { type: Date, default: null }, // نهاية الاشتراك إذا يديرها الباكيند
}, { timestamps: true });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
