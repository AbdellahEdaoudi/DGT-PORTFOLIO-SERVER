const express = require("express");
const app = express.Router();
const { handleWebhook } = require("../controllers/paypalWebhook.Controller");

app.post("/webhook", handleWebhook);

module.exports = app;