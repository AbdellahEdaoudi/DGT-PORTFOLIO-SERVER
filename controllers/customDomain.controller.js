const User = require("../models/User");
const dns = require('dns').promises;
const axios = require('axios');

// Vercel Configuration
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;

// Helper: Add Domain to Vercel Project
const addToVercel = async (domain) => {
    if (!VERCEL_PROJECT_ID || !VERCEL_API_TOKEN) {
        console.log("⚠️ Vercel credentials missing. Skipping auto-add.");
        return false;
    }
    try {
        console.log(`Adding ${domain} to Vercel...`);
        await axios.post(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            { name: domain },
            { headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` } }
        );
        console.log(`✅ ${domain} added to Vercel!`);
        return true;
    } catch (error) {
        if (error.response?.status === 409) return true; // Already exists
        console.error("❌ Vercel API Error:", error.response?.data || error.message);
        return false;
    }
};

// Add or Update Custom Domain
exports.setCustomDomain = async (req, res) => {
    try {
        const { email, customDomain } = req.body;
        if (!email || !customDomain) return res.status(400).json({ status: false, message: "Required fields missing" });

        // Validate domain format (Apex only)
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(customDomain)) return res.status(400).json({ status: false, message: "Invalid domain format" });

        // Check if taken
        const existing = await User.findOne({ customDomain, email: { $ne: email } });
        if (existing) return res.status(400).json({ status: false, message: "Domain already taken" });

        const user = await User.findOneAndUpdate(
            { email },
            { customDomain, customDomainVerified: false },
            { new: true }
        );

        res.json({
            status: true,
            message: "Domain saved. Please verify it.",
            data: { customDomain: user.customDomain }
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Verify Custom Domain
exports.verifyCustomDomain = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user?.customDomain) return res.status(404).json({ status: false, message: "No domain found" });

        const domain = user.customDomain;

        // 1. Check DNS (A Record)
        try {
            const records = await dns.resolve4(domain).catch(() => []);
            const isPointingToVercel = records.includes('76.76.21.21');

            if (isPointingToVercel) {
                // 2. IMPORTANT: Add to Vercel automatically
                await addToVercel(domain);

                // 3. Update DB
                user.customDomainVerified = true;
                await user.save();

                return res.json({
                    status: true,
                    message: "Domain Verified & Configured Successfully! It may take a few minutes to work globally.",
                    data: { verified: true }
                });
            } else {
                return res.status(400).json({
                    status: false,
                    message: "DNS not ready. Please ensure A Record points to 76.76.21.21",
                });
            }
        } catch (e) {
            return res.status(400).json({ status: false, message: "DNS Error: " + e.message });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

// Get User by Domain
exports.getUserByDomain = async (req, res) => {
    try {
        const { domain } = req.params;
        const user = await User.findOne({ customDomain: domain, customDomainVerified: true }).select('username');
        if (!user) return res.status(404).json({ status: false });
        res.json({ status: true, user });
    } catch (error) {
        res.status(500).json({ status: false });
    }
};

// Remove Domain
exports.removeCustomDomain = async (req, res) => {
    const { email } = req.body;
    // Optional: Remove from Vercel API here if needed
    await User.findOneAndUpdate({ email }, { customDomain: null, customDomainVerified: false });
    res.json({ status: true, message: "Removed" });
};

exports.getCustomDomainSettings = async (req, res) => {
    const { email } = req.params;
    const user = await User.findOne({ email }).select('username customDomain customDomainVerified');
    res.json({ status: true, data: user });
};
