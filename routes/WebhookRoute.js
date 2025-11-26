const express = require("express");
const app = express.Router();
const { handleWebhook } = require("../controllers/paypalWebhookController");

app.post("/webhook", handleWebhook);

module.exports = app;