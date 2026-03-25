const express = require('express');
const router = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');

router.post('/', SubscriptionController.createSubscription);
router.get('/subscriptions', SubscriptionController.getSubscriptions);
router.post('/:id/cancel', SubscriptionController.cancelSubscription);
router.post('/:id/sync', SubscriptionController.syncSubscription);
router.get('/user/:email', SubscriptionController.getUserSubscription);
router.delete('/:id', SubscriptionController.deleteSubscriptionById);

module.exports = router;
