const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypal.controller');

router.get('/plans', paypalController.getPlans);
router.get('/create-product-and-plans', paypalController.createProductAndPlans);
router.get('/create-promo-product-and-plans', paypalController.createPromoProductAndPlans);

module.exports = router;
