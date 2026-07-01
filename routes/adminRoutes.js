const express = require("express");
const router = express.Router();
const AdminController = require("../controllers/admin.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');

// User Routes
router.get('/appdata', isAuthenticated, AdminController.GetDataApp);
router.delete('/user/:id', isAuthenticated, AdminController.deleteUserById);
router.delete('/contacte/:id', isAuthenticated, AdminController.deleteContactById);
router.put('/contacte/:id/reply', isAuthenticated, AdminController.replyToContact);
router.delete('/link/:id', isAuthenticated, AdminController.deleteLinkById);
router.post('/payment', isAuthenticated, AdminController.createPaymentManually);
router.delete('/payment/:id', isAuthenticated, AdminController.deletePaymentById);
router.put('/payment/:id', isAuthenticated, AdminController.updatePaymentStatus);

router.post('/send-bulk-emails', isAuthenticated, AdminController.sendBulkEmails);
router.get('/cloudinary-images', isAuthenticated, AdminController.getCloudinaryImages);
router.delete('/cloudinary-images', isAuthenticated, AdminController.deleteCloudinaryImage);


module.exports = router;