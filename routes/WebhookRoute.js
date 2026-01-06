const express = require("express");
const router = express.Router();
const { handleWebhook } = require("../controllers/paypalWebhook.Controller");

router.post("/webhook", handleWebhook);

module.exports = router;