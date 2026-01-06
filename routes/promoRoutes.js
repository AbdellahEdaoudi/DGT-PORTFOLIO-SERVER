const { promoLimiter } = require("../Limiting/promoLimiter");
const express = require("express");
const PromoCodeController = require("../controllers/promo.Controller");
const router = express.Router();


router.post("/create", PromoCodeController.createPromo);
router.post("/validate", promoLimiter, PromoCodeController.validatePromo);
module.exports = router;
