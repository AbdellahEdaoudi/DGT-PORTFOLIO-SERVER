const Subscription = require('../models/Subscription');
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const BASE = process.env.BASE;

async function getAccessToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 
      'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + SECRET).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

exports.createSubscription = async (req, res) => {
  try {
    const { userEmail, planId, subscriptionID, nameplan, promoCode } = req.body;

    if (!userEmail || !planId || !subscriptionID || !nameplan) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    let subscription = await Subscription.findOne({userEmail,planId});

    if (subscription) {
        subscription.subscriptionID = subscriptionID;
        subscription.nameplan = nameplan;
        subscription.planId = planId;
        subscription.status = "ACTIVE";
        subscription.paymentType = "subscription";
        subscription.expiresAt = null;
        await subscription.save();
        return res.status(200).json({ message: "Subscription reactivated"});
      }
    subscription = await Subscription.create({
      userEmail,
      planId,
      nameplan,
      subscriptionID,
      promoCode,
      paymentType: "subscription",
      status: "ACTIVE",
      expiresAt: null
    });

    res.status(201).json({ message: "Subscription saved", subscription });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving subscription" });
  }
};

// GET /subscriptions
exports.getSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().select("-__v"); 
    res.status(200).json({ success: true, data: subscriptions });
  } catch (err) {
    console.error("Error fetching subscriptions:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET /user/:email
exports.getUserSubscription = async (req, res) => {
  try {
    const { email } = req.params;
    const subscription = await Subscription.findOne({ userEmail: email, status: "ACTIVE" }).sort({ createdAt: -1 });
    if (!subscription) {
      return res.status(404).json({ success: false, message: "No active subscription found" });
    }
    res.status(200).json({ success: true, data: subscription });
  } catch (err) {
    console.error("Error fetching user subscription:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// حذف اشتراك بواسطة الـ ID
exports.deleteSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByIdAndDelete(id);
    if (!subscription) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }
    res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (err) {
    console.error("Error deleting subscription:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Cancel subscription (PayPal API + DB update)
exports.cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription || !subscription.subscriptionID) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const token = await getAccessToken();
    const response = await fetch(`${BASE}/v1/billing/subscriptions/${subscription.subscriptionID}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: "Customer requested cancellation" })
    });

    if (response.ok || response.status === 204) {
      subscription.status = "CANCELLED";
      await subscription.save();
      return res.status(200).json({ success: true, message: "Subscription cancelled successfully" });
    } else {
      const errorData = await response.json();
      console.error("PayPal Error:", errorData);
      return res.status(400).json({ success: false, message: "Failed to cancel at PayPal" });
    }
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};// Sync subscription with PayPal status
exports.syncSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findById(id);
    if (!subscription || !subscription.subscriptionID) {
      return res.status(404).json({ success: false, message: "Subscription not found" });
    }

    const token = await getAccessToken();
    const response = await fetch(`${BASE}/v1/billing/subscriptions/${subscription.subscriptionID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const paypalData = await response.json();
      // Update local status and expiry date
      subscription.status = paypalData.status; // ACTIVE, CANCELLED, EXPIRED, etc.
      
      if (paypalData.billing_info && paypalData.billing_info.next_billing_time) {
        subscription.expiresAt = new Date(paypalData.billing_info.next_billing_time);
      } else if (paypalData.start_time && !subscription.expiresAt) {
          // Fallback or logic for expired ones
          // If it's cancelled, we might want to keep the old expiresAt or check the last payment
      }

      await subscription.save();
      return res.status(200).json({ 
        success: true, 
        message: "Subscription synced successfully", 
        data: subscription 
      });
    } else {
      const errorData = await response.json();
      console.error("PayPal Sync Error:", errorData);
      return res.status(400).json({ success: false, message: "Failed to fetch status from PayPal" });
    }
  } catch (err) {
    console.error("Error syncing subscription:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
