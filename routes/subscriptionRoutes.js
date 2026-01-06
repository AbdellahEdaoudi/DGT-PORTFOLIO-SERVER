const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');

router.post('/', SubscriptionController.createSubscription);
router.get('/subscriptions', SubscriptionController.getSubscriptions);
router.delete('/:id', SubscriptionController.deleteSubscriptionById);

module.exports = router;
