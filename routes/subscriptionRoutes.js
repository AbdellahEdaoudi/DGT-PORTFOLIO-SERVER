const express = require('express');
const app = express.Router();
const SubscriptionController = require('../controllers/subscription.controller');

app.post('/', SubscriptionController.createSubscription);
app.get('/subscriptions', SubscriptionController.getSubscriptions);
app.delete('/:id', SubscriptionController.deleteSubscriptionById);

module.exports = app;
