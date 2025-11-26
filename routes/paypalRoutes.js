const express = require('express');
const app = express.Router();
const paypalController = require('../controllers/paypal.controller');

app.get('/create-product-and-plans', paypalController.createProductAndPlans);
app.get('/create-promo-product-and-plans', paypalController.createPromoProductAndPlans);

module.exports = app;
