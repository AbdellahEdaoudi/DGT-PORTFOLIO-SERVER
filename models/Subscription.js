const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  plan: { type: String, enum: ["monthly", "yearly"], required: true },
  paypal_subscription_id: { type: String, required: true },
  status: { type: String, enum: ["active", "cancelled", "expired", "pending"], default: "pending" },
  start_date: { type: Date, required: true },
  end_date: { type: Date }
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
