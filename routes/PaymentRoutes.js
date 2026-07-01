const express = require('express');
const router = express.Router();
const isAuthenticated = require('../middlewares/isAuthenticated');
const PaymentController = require('../controllers/payment.controller');

router.post('/', isAuthenticated, PaymentController.createPayment);

module.exports = router;
