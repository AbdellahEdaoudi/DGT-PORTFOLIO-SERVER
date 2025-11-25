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



