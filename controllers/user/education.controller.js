const User = require('../../models/User');

// 🟢 Save (Add or Update) a single education item
exports.saveUserEducationItem = async (req, res) => {
    const { email } = req.user;
    let item = req.body;

    try {
        const educationObj = {
            school: item.school ? item.school.trim().substring(0, 100) : "",
            degree: item.degree ? item.degree.trim().substring(0, 100) : "",
            field: item.field ? item.field.trim().substring(0, 100) : "",
            startYear: item.startYear ? item.startYear.trim().substring(0, 20) : "",
            endYear: item.endYear ? item.endYear.trim().substring(0, 20) : "",
        };

        if (item._id) {
            educationObj._id = item._id;
            // Update existing
            const updatedUser = await User.findOneAndUpdate(
                { email, "education._id": item._id },
                { $set: { "education.$": educationObj } },
                { new: true }
            );
            if (!updatedUser) return res.status(404).json({ message: "User or Education item not found" });
            res.json(updatedUser);

        } else {
            // Add new
            const updatedUser = await User.findOneAndUpdate(
                { email },
                { $push: { education: educationObj } },
                { new: true }
            );
            if (!updatedUser) return res.status(404).json({ message: "User not found" });
            res.json(updatedUser);
        }

    } catch (error) {
        console.error("Error saving education item:", error);
        res.status(500).json({ error: error.message });
    }
};

// 🟢 Delete a single education item by ID
exports.deleteUserEducation = async (req, res) => {
    const { email } = req.user;
    const { educationId } = req.params;

    try {
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(educationId)) {
            return res.status(400).json({ message: "Invalid education ID" });
        }

        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $pull: { education: { _id: new mongoose.Types.ObjectId(educationId) } } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found or education item not found" });
        }

        res.json(updatedUser);
    } catch (error) {
        console.error("Error deleting education:", error);
        res.status(500).json({ error: error.message });
    }
};

// 🟢 Reorder education
exports.reorderUserEducation = async (req, res) => {
    const { email } = req.user;
    const { education } = req.body; // Expecting array of objects with _id

    try {
        if (!Array.isArray(education)) {
            return res.status(400).json({ error: "Education must be an array" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create a map of the new order: ID -> Index
        const orderMap = new Map();
        education.forEach((e, index) => {
            if (e._id) orderMap.set(e._id.toString(), index);
        });

        // Sort the user's existing education based on the map
        user.education.sort((a, b) => {
            const indexA = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString()) : 9999;
            const indexB = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString()) : 9999;
            return indexA - indexB;
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error("Error reordering education:", error);
        res.status(500).json({ error: error.message });
    }
};
