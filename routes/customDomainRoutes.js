const express = require("express");
const router = express.Router();
const customDomainController = require("../controllers/customDomain.controller");
const isAuthenticated = require("../middlewares/isAuthenticated");
const { customDomainLimiter } = require("../Limiting/customDomainLimiter");

// Set or update custom domain
router.post("/set", isAuthenticated, customDomainLimiter, customDomainController.setCustomDomain);

// Verify custom domain (check A Record)
router.post("/verify", isAuthenticated, customDomainLimiter, customDomainController.verifyCustomDomain);

// Remove custom domain
router.delete("/remove", isAuthenticated, customDomainLimiter, customDomainController.removeCustomDomain);

module.exports = router;
