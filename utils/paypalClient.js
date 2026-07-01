const axios = require('axios');

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const PAYPAL_API_BASE = process.env.BASE; // https://api-m.sandbox.paypal.com او https://api-m.paypal.com

async function getAccessToken() {
  const response = await axios.post(
    `${PAYPAL_API_BASE}/v1/oauth2/token`,
    'grant_type=client_credentials',
    {
      auth: {
        username: CLIENT_ID,
        password: SECRET,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  return response.data.access_token;
}

async function getOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await axios.get(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  return response.data;
}

async function captureOrder(orderId) {
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

module.exports = { getAccessToken, getOrder, captureOrder };