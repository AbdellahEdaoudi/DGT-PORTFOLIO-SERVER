// controllers/paypalWebhookController.js
const Subscription = require("../models/Subscription");

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;
    const subId = event.resource.id;
    const planId = event.resource.plan_id;

    const subscription = await Subscription.findOne({ subscriptionID: subId });
    if (!subscription) return res.sendStatus(200);

    // تحديث الحالة
    subscription.status = event.resource.status || subscription.status;
    subscription.planId = planId;

    // استخدام next_billing_time إذا موجود
    if (event.resource.billing_info?.next_billing_time) {
      subscription.expiresAt = new Date(event.resource.billing_info.next_billing_time);
    }

    await subscription.save();
    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
};
