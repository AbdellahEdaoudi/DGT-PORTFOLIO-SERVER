const axios = require("axios");

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const BASE = process.env.BASE; // LIVE: https://api-m.paypal.com

// -------------------------------------------------------------
// 1) GET ACCESS TOKEN
// -------------------------------------------------------------
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

// -------------------------------------------------------------
// 2) CREATE PRODUCT + PLANS
// -------------------------------------------------------------
exports.createProductAndPlans = async (req, res) => {
  try {
    const token = await getAccessToken();

    // ------------------------ CREATE PRODUCT ------------------------
    const productRes = await axios.post(
      `${BASE}/v1/catalogs/products`,
      {
        name: "DGT Portfolio Subscription",
        description: "Digital wallet subscription service",
        type: "SERVICE",
        category: "SOFTWARE",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const productId = productRes.data.id;
    const plans = [];

    // -------------------------------------------------------------
    // Helper function to create plan
    // -------------------------------------------------------------
    async function createPlan(body, name) {
      const planRes = await axios.post(
        `${BASE}/v1/billing/plans`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      plans.push({ name, planId: planRes.data.id });
    }

    // -------------------------------------------------------------
    // 3 PLANS
    // -------------------------------------------------------------

    // ------------------ MONTHLY PLAN ($1/month) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Monthly Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "1", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "Monthly Plan"
    );

    // ------------------ 6-MONTH PLAN ($5 per 6 months) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "6-Month Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 6 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "5", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "6-Month Plan"
    );

    // ------------------ ANNUAL PLAN ($9/year) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Annual Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "YEAR", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "9", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "Annual Plan"
    );

    // -------------------------------------------------------------
    return res.json({ productId, plans });
  } catch (err) {
    console.error("PayPal Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create PayPal plans" });
  }
};

// -------------------------------------------------------------
// 3) CREATE PRODUCT + PROMO PLANS
// -------------------------------------------------------------
exports.createPromoProductAndPlans = async (req, res) => {
  try {
    const token = await getAccessToken();

    // ------------------------ CREATE PRODUCT ------------------------
    const productRes = await axios.post(
      `${BASE}/v1/catalogs/products`,
      {
        name: "DGT Portfolio Promo Subscription",
        description: "Special promo subscription with discounted rates",
        type: "SERVICE",
        category: "SOFTWARE",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const productId = productRes.data.id;
    const plans = [];

    // -------------------------------------------------------------
    // Helper function to create plan
    // -------------------------------------------------------------
    async function createPlan(body, name) {
      const planRes = await axios.post(
        `${BASE}/v1/billing/plans`,
        body,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      plans.push({ name, planId: planRes.data.id });
    }

    // ------------------ MONTHLY PLAN ($1/month) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Promo Monthly Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "1", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "Promo Monthly Plan"
    );

    // ------------------ 6-MONTH PLAN ($3 per 6 months) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Promo 6-Month Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 6 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "3", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "Promo 6-Month Plan"
    );

    // ------------------ ANNUAL PLAN ($5/year) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Promo Annual Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "YEAR", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "5", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "Promo Annual Plan"
    );

    return res.json({ productId, plans });
  } catch (err) {
    console.error("PayPal Promo Error:", err.response?.data || err.message);
    return res.status(500).json({ message: "Failed to create PayPal promo plans" });
  }
};

