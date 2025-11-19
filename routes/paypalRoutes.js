const express = require('express');
const router = express.Router();
const paypalController = require('../controllers/paypal.controller');

router.get('/create-product-and-plans',paypalController.createProductAndPlans);

module.exports = router;
