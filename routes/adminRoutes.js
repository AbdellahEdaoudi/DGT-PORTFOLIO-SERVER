const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');

// User Routes
router.get('/appdata', isAuthenticated, AdminController.GetDataApp);
router.delete('/user/:id', isAuthenticated, AdminController.deleteUserById);
router.delete('/contacte/:id', isAuthenticated, AdminController.deleteContactById);
router.delete('/link/:id', isAuthenticated, AdminController.deleteLinkById);
router.delete('/promo/:id', isAuthenticated, AdminController.deletePromoById);
router.post('/send-expired-emails', isAuthenticated, AdminController.sendTrialExpiredEmails);
router.post('/send-bulk-emails', isAuthenticated, AdminController.sendBulkEmails);
router.get('/cloudinary-images', isAuthenticated, AdminController.getCloudinaryImages);
router.delete('/cloudinary-images', isAuthenticated, AdminController.deleteCloudinaryImage);


module.exports = router;