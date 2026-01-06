const User = require('../../models/User');

// 🟢 Save (Add or Update) a single experience item
exports.saveUserExperienceItem = async (req, res) => {
    const { email } = req.user;
    let item = req.body;

    try {
        const experienceObj = {
            company: item.company ? item.company.trim().substring(0, 100) : "",
            role: item.role ? item.role.trim().substring(0, 100) : "",
            description: item.description ? item.description.trim().substring(0, 2000) : "",
            startDate: item.startDate ? item.startDate.trim().substring(0, 20) : "",
            endDate: item.endDate ? item.endDate.trim().substring(0, 20) : "",
        };

        if (item._id) {
            experienceObj._id = item._id;
            // Update existing experience
            const updatedUser = await User.findOneAndUpdate(
                { email, "experience._id": item._id },
                { $set: { "experience.$": experienceObj } },
                { new: true }
            );
            if (!updatedUser) return res.status(404).json({ message: "User or Experience not found" });
            res.json(updatedUser);

        } else {
            // Add new experience
            const updatedUser = await User.findOneAndUpdate(
                { email },
                { $push: { experience: experienceObj } },
                { new: true }
            );
            if (!updatedUser) return res.status(404).json({ message: "User not found" });
            res.json(updatedUser);
        }

    } catch (error) {
        console.error("Error saving experience item:", error);
        res.status(500).json({ error: error.message });
    }
};

// 🟢 Delete a single experience item by ID
exports.deleteUserExperience = async (req, res) => {
    const { email } = req.user;
    const { experienceId } = req.params;

    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(experienceId)) {
            return res.status(400).json({ message: "Invalid experience ID" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $pull: { experience: { _id: new mongoose.Types.ObjectId(experienceId) } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or experience not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Error deleting experience:", error);
        res.status(500).json({ error: error.message });
    }
};

// 🟢 Reorder experience
exports.reorderUserExperience = async (req, res) => {
    const { email } = req.user;
    const { experience } = req.body; // Expecting array of objects with _id

    try {
        if (!Array.isArray(experience)) {
            return res.status(400).json({ error: "Experience must be an array" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create a map of the new order: ID -> Index
        const orderMap = new Map();
        experience.forEach((e, index) => {
            if (e._id) orderMap.set(e._id.toString(), index);
        });

        // Sort the user's existing experience based on the map
        user.experience.sort((a, b) => {
            const indexA = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString()) : 9999;
            const indexB = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString()) : 9999;
            return indexA - indexB;
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error("Error reordering experience:", error);
        res.status(500).json({ error: error.message });
    }
};
