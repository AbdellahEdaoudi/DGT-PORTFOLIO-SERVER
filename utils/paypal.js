const fetch = require('node-fetch');

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const SECRET = process.env.PAYPAL_SECRET;
const BASE = process.env.BASE;

async function getAccessToken() {
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + SECRET).toString('base64') },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

async function createProduct() {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/catalogs/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({
      name: "DGT Portfolio Subscription",
      description: "Digital wallet subscription service",
      type: "SERVICE",
      category: "SOFTWARE"
    })
  });
  const data = await res.json();
  return data; // يحتوي على product_id
}

module.exports = { getAccessToken, createProduct };
