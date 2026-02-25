// controllers/paypalWebhookController.js
const Subscription = require("../models/Subscription");
const { getAccessToken } = require("./paypal.controller");
const axios = require("axios");

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body;

    // Extract Subscription ID from the webhook payload. 
    // Depending on the event_type, the ID might be in resource.id or resource.billing_agreement_id
    let subId = event.resource.id;
    if (event.resource.billing_agreement_id) {
      subId = event.resource.billing_agreement_id;
    }

    const subscription = await Subscription.findOne({ subscriptionID: subId });
    if (!subscription) {
      console.log(`Webhook ignored: Subscription not found for ID ${subId}`);
      return res.sendStatus(200);
    }

    const planId = event.resource.plan_id;

    // Fetch subscription from PayPal API to guarantee up-to-date data 
    // especially for PAYMENT.SALE.COMPLETED where billing_info is not provided
    try {
      const token = await getAccessToken();
      const subRes = await axios.get(`${process.env.BASE}/v1/billing/subscriptions/${subId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (subRes.data.billing_info?.next_billing_time) {
        subscription.expiresAt = new Date(subRes.data.billing_info.next_billing_time);
      }
      if (subRes.data.status) {
        subscription.status = subRes.data.status;
      }
    } catch (apiErr) {
      console.error("Error fetching subscription from PayPal:", apiErr.message);

      // Fallback to event data if PayPal API fetch fails
      subscription.status = event.resource.status || subscription.status;
      if (event.resource.billing_info?.next_billing_time) {
        subscription.expiresAt = new Date(event.resource.billing_info.next_billing_time);
      }
    }

    if (planId) {
      subscription.planId = planId;
    }

    await subscription.save();
    return res.sendStatus(200);
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.sendStatus(500);
  }
};
