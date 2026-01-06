const express = require("express");
const router = express.Router();
const UserCertificatesController = require("../../controllers/user/certificates.controller");
const isAuthenticated = require('../../middlewares/isAuthenticated');
const upload = require('../../middlewares/multer');

// Certificates Routes
router.post("/update/certificates/upload", isAuthenticated, upload.any(), UserCertificatesController.uploadCertificateImage);
router.put("/update/certificates/item", isAuthenticated, UserCertificatesController.saveUserCertificateItem);
router.delete("/update/certificates/:certificateId", isAuthenticated, UserCertificatesController.deleteUserCertificate);
router.put("/update/certificates/order", isAuthenticated, UserCertificatesController.reorderUserCertificates);

module.exports = router;
