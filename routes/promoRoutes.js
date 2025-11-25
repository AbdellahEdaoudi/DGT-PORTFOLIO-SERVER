const { promoLimiter } = require("../Limiting/promoLimiter");
const express = require("express");
const PromoCodeController = require("../controllers/promo.Controller");
const app = express();


app.post("/create", PromoCodeController.createPromo);
app.post("/validate", promoLimiter, PromoCodeController.validatePromo);
module.exports = app;
