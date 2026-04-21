const Promocode = require("../models/Promocode");
const axios = require("axios");
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const BASE = process.env.BASE; // PayPal API base 
const PROMO_PRODUCT_ID = "PROD-96T7711539353642S";

async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");
  const response = await axios.post(
    `${BASE}/v1/oauth2/token`,
    "grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  return response.data.access_token;
}

// Create promo code
exports.createPromo = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Promo code is required" });
    }

    // تحقق إن كان الكود موجود مسبقًا كما هو
    const existing = await Promocode.findOne({ code: code });
    if (existing) {
      return res.status(400).json({
        error: "Duplicate promo code. This code already exists.",
        promo: existing,
      });
    }

    // إنشاء الكود كما هو
    const promo = await Promocode.create({ code });

    res.json({ success: true, promo });
  } catch (err) {
    // إرجاع كل تفاصيل الخطأ الممكنة
    console.error("Create promo error:", err);
    res.status(500).json({
      error: err.message,
      name: err.name,
      stack: err.stack,
      code: err.code,
    });
  }
};


// Validate promo code
exports.validatePromo = async (req, res) => {
  try {
    const { code } = req.body;

    const promo = await Promocode.findOne({ code });
    if (!promo) {
      return res.status(400).json({ valid: false, msg: "Invalid promo code" });
    }

    const token = await getAccessToken();
    const plansRes = await axios.get(`${BASE}/v1/billing/plans`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { product_id: PROMO_PRODUCT_ID },
    });

    const plans = plansRes.data.plans || [];

    res.json({ valid: true, promo, plans });
  } catch (err) {
    console.error(err.response?.data || err.message);

    const status = err.response?.status || 500;
    const message =
      err.response?.data?.msg ||
      err.response?.data?.message ||
      err.message ||
      "Failed to validate promo code";

    res.status(status).json({ valid: false, msg: message });
  }
};


