const express = require("express");
const app = express();
const AdminController = require("../controllers/admin.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');

// User Routes
app.get('/appdata', isAuthenticated, AdminController.GetDataApp);
app.delete('/user/:id', isAuthenticated, AdminController.deleteUserById);
app.delete('/contacte/:id', isAuthenticated, AdminController.deleteContactById);
app.delete('/link/:id', isAuthenticated, AdminController.deleteLinkById);
app.delete('/promo/:id', isAuthenticated, AdminController.deletePromoById);
app.get('/expired-trials', isAuthenticated, AdminController.getExpiredTrialUsers);
app.post('/send-expired-emails', isAuthenticated, AdminController.sendTrialExpiredEmails);
app.post('/send-bulk-emails', isAuthenticated, AdminController.sendBulkEmails);


module.exports = app;