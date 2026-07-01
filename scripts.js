require('dotenv').config();
const mongoose = require('mongoose');
const Payment = require('./models/Payment');

async function Script() {
  try {
    await mongoose.connect(process.env.MONGODB_ATLAS);
    console.log('Connected to MongoDB');
    const paymentusers = await Payment.find({})
    console.log(paymentusers);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

Script();