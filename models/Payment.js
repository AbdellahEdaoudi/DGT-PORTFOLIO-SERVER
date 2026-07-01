const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  useremail: { type: String, required: true, index: true },
  status: {
    type: String,
    enum: ['ACTIVE', 'REFUNDED'],
    default: 'ACTIVE',
  },
  paypalOrderId: { type: String, required: true, unique: true },
  paypalPayerId: { type: String },
  amount: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema, 'payments');
