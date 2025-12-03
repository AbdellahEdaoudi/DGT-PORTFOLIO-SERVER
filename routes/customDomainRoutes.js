const express = require("express");
const router = express.Router();
const customDomainController = require("../controllers/customDomain.controller");

// Set or update custom domain
router.post("/set", customDomainController.setCustomDomain);

// Verify custom domain (check A Record)
router.post("/verify", customDomainController.verifyCustomDomain);

// Get user by custom domain
router.get("/user/:domain", customDomainController.getUserByDomain);

// Get user by domain (alternative route for middleware)
router.get("/by-domain/:domain", customDomainController.getUserByDomain);

// Remove custom domain
router.delete("/remove", customDomainController.removeCustomDomain);

// Get custom domain settings for a user
router.get("/settings/:email", customDomainController.getCustomDomainSettings);

module.exports = router;
