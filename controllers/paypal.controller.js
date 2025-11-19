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

    // ------------------ MONTHLY PLAN ($1 trial → $10/month) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "Monthly Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "TRIAL",
            sequence: 1,
            total_cycles: 1,
            pricing_scheme: {
              fixed_price: { value: "1", currency_code: "USD" },
            },
          },
          {
            frequency: { interval_unit: "MONTH", interval_count: 1 },
            tenure_type: "REGULAR",
            sequence: 2,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "10", currency_code: "USD" },
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

    // ------------------ 4-MONTH PLAN ($30 per 4 months) ------------------
    await createPlan(
      {
        product_id: productId,
        name: "4-Month Plan",
        billing_cycles: [
          {
            frequency: { interval_unit: "MONTH", interval_count: 4 },
            tenure_type: "REGULAR",
            sequence: 1,
            total_cycles: 0,
            pricing_scheme: {
              fixed_price: { value: "30", currency_code: "USD" },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: "CONTINUE",
          payment_failure_threshold: 3,
        },
      },
      "4-Month Plan"
    );

    // ------------------ ANNUAL PLAN ($60 yearly) ------------------
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
              fixed_price: { value: "60", currency_code: "USD" },
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
