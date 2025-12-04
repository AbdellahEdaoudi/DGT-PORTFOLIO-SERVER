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
        return { success: false, error: "Server misconfigured: Missing Vercel credentials" };
    }
    try {
        console.log(`Adding ${domain} to Vercel...`);
        await axios.post(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            { name: domain },
            { headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` } }
        );
        console.log(`✅ ${domain} added to Vercel!`);
        return { success: true };
    } catch (error) {
        if (error.response?.status === 409) return { success: true }; // Already exists
        console.error("❌ Vercel API Error:", error.response?.data || error.message);
        return { success: false, error: error.response?.data?.error?.message || "Failed to register domain with Vercel" };
    }
};

// Helper: Remove Domain from Vercel Project
const removeFromVercel = async (domain) => {
    if (!VERCEL_PROJECT_ID || !VERCEL_API_TOKEN) return;
    try {
        console.log(`Removing ${domain} from Vercel...`);
        await axios.delete(
            `https://api.vercel.com/v9/projects/${VERCEL_PROJECT_ID}/domains/${domain}${VERCEL_TEAM_ID ? `?teamId=${VERCEL_TEAM_ID}` : ''}`,
            { headers: { Authorization: `Bearer ${VERCEL_API_TOKEN}` } }
        );
        console.log(`✅ ${domain} removed from Vercel!`);
    } catch (error) {
        console.error("❌ Vercel Remove Error:", error.response?.data || error.message);
    }
};

// Add or Update Custom Domain
exports.setCustomDomain = async (req, res) => {
    const email = req.user?.email;
    try {
        const { customDomain } = req.body;
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
    const email = req.user?.email;
    try {
        const user = await User.findOne({ email });
        if (!user?.customDomain) return res.status(404).json({ status: false, message: "No domain found" });

        const domain = user.customDomain;

        // 1. Check DNS (A Record) - Just verify domain resolves
        try {
            const records = await dns.resolve4(domain).catch(() => []);

            if (records.length > 0) {
                // 2. Add to Vercel automatically
                const vercelResult = await addToVercel(domain);

                if (!vercelResult.success) {
                    return res.status(500).json({
                        status: false,
                        message: vercelResult.error || "Failed to configure domain on server."
                    });
                }

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
                    message: "DNS not ready. Please ensure your domain has a valid A Record configured.",
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
    try {
        const email = req.user?.email;
        const user = await User.findOne({ email });

        if (user?.customDomain) {
            // Remove from Vercel
            await removeFromVercel(user.customDomain);
        }

        await User.findOneAndUpdate({ email }, { customDomain: null, customDomainVerified: false });
        res.json({ status: true, message: "Removed" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.getCustomDomainSettings = async (req, res) => {
    const { email } = req.params;
    const user = await User.findOne({ email }).select('username customDomain customDomainVerified');
    res.json({ status: true, data: user });
};
