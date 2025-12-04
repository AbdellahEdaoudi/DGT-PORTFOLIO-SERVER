const express = require("express");
const router = express.Router();
const customDomainController = require("../controllers/customDomain.controller");
const isAuthenticated = require("../middlewares/isAuthenticated");

// Set or update custom domain
router.post("/set", isAuthenticated, customDomainController.setCustomDomain);

// Verify custom domain (check A Record)
router.post("/verify", isAuthenticated, customDomainController.verifyCustomDomain);

// Get user by custom domain (public route)
router.get("/user/:domain", customDomainController.getUserByDomain);

// Get user by domain (alternative route for middleware - public)
router.get("/by-domain/:domain", customDomainController.getUserByDomain);

// Remove custom domain
router.delete("/remove", isAuthenticated, customDomainController.removeCustomDomain);

// Get custom domain settings for a user
router.get("/settings/:email", customDomainController.getCustomDomainSettings);

module.exports = router;
