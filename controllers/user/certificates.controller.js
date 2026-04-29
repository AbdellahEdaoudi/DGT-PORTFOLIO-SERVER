const User = require('../../models/User');
const cloudinary = require('cloudinary').v2;

// Upload Image Helper
exports.uploadCertificateImage = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const file = req.files[0];

        // Check size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            const fs = require('fs');
            try { fs.unlinkSync(file.path); } catch (e) { }
            return res.status(400).json({ error: "File size exceeds 2MB" });
        }

        const result = await cloudinary.uploader.upload(file.path, {
            folder: "certificates",
        });

        // Clean up
        const fs = require('fs');
        try { fs.unlinkSync(file.path); } catch (e) { }

        res.json({ url: result.secure_url });
    } catch (error) {
        console.error("Error uploading image:", error);
        if (req.files && req.files[0]) {
            const fs = require('fs');
            try { fs.unlinkSync(req.files[0].path); } catch (e) { }
        }
        res.status(500).json({ error: error.message });
    }
};

// Save (Add or Update) a single certificate item
exports.saveUserCertificateItem = async (req, res) => {
    const { email } = req.user;
    let item = req.body;

    try {
        const certObj = {
            title: item.title ? item.title.trim().substring(0, 100) : "",
            description: item.description ? item.description.trim().substring(0, 200) : "",
            cfimage: item.cfimage ? item.cfimage.trim().substring(0, 1000) : "",
        };

        if (item._id) {
            certObj._id = item._id;

            // Find user and the specific certificate to check for old image
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found" });

            const oldCert = user.certificates.id(item._id);

            // Delete old image if it exists and is different from the new one
            if (oldCert && oldCert.cfimage && oldCert.cfimage !== certObj.cfimage) {
                try {
                    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
                    const match = oldCert.cfimage.match(regex);
                    if (match && match[1]) {
                        await cloudinary.uploader.destroy(match[1]);
                    }
                } catch (err) {
                    console.error("Error deleting old image from Cloudinary during update:", err);
                }
            }

            // Update existing
            const updatedUser = await User.findOneAndUpdate(
                { email, "certificates._id": item._id },
                { $set: { "certificates.$": certObj } },
                { new: true }
            );

            if (!updatedUser) return res.status(404).json({ message: "User or Certificate not found" });
            res.json(updatedUser);

        } else {
            // Add new - Check limit first (10 items)
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found" });

            if (user.certificates && user.certificates.length >= 10) {
                return res.status(400).json({ error: "Maximum limit of 10 certificates reached" });
            }

            user.certificates.push(certObj);
            await user.save();
            res.json(user);
        }

    } catch (error) {
        console.error("Error saving certificate item:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a single certificate item by ID
exports.deleteUserCertificate = async (req, res) => {
    const { email } = req.user;
    const { certificateId } = req.params;

    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(certificateId)) {
            return res.status(400).json({ message: "Invalid certificate ID" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Find the certificate to delete to remove image from Cloudinary
        const certificate = user.certificates.id(certificateId);
        if (certificate?.cfimage) {
            try {
                // Robust extraction of public_id
                const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/;
                const match = certificate.cfimage.match(regex);
                if (match && match[1]) {
                    await cloudinary.uploader.destroy(match[1]);
                }
            } catch (err) {
                console.error("Error deleting image from Cloudinary:", err);
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $pull: { certificates: { _id: new mongoose.Types.ObjectId(certificateId) } } },
            { new: true }
        );

        res.json(updatedUser);
    } catch (error) {
        console.error("Error deleting certificate:", error);
        res.status(500).json({ error: error.message });
    }
};

// Reorder certificates
exports.reorderUserCertificates = async (req, res) => {
    const { email } = req.user;
    const { certificates } = req.body;

    try {
        if (!Array.isArray(certificates)) {
            return res.status(400).json({ error: "Certificates must be an array" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const orderMap = new Map();
        certificates.forEach((c, index) => {
            if (c._id) orderMap.set(c._id.toString(), index);
        });

        user.certificates.sort((a, b) => {
            const indexA = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString()) : 9999;
            const indexB = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString()) : 9999;
            return indexA - indexB;
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error("Error reordering certificates:", error);
        res.status(500).json({ error: error.message });
    }
};
