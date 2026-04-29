const User = require('../../models/User');
const sanitizeHtml = require('sanitize-html');

// Save (Add or Update) a single project item
exports.saveUserProjectItem = async (req, res) => {
    const { email } = req.user;
    let item = req.body;

    try {
        // Sanitize input
        let techs = Array.isArray(item.technologies)
            ? item.technologies
                .map(t => (typeof t === "string" ? t.trim().substring(0, 20) : ""))
                .filter(t => t)
            : [];

        const projectObj = {
            title: item.title ? item.title.trim().substring(0, 100) : "",
            description: item.description ? item.description.trim().substring(0, 2000) : "",
            link: item.link ? item.link.trim().substring(0, 1000) : "",
            image: item.image ? item.image.trim().substring(0, 1000) : "",
            technologies: techs,
            startDate: item.startDate ? item.startDate.trim().substring(0, 20) : "",
            endDate: item.endDate ? item.endDate.trim().substring(0, 20) : "",
        };

        if (item._id) {
            projectObj._id = item._id;
            // Update existing project
            const updatedUser = await User.findOneAndUpdate(
                { email, "projects._id": item._id },
                { $set: { "projects.$": projectObj } },
                { new: true }
            );
            if (!updatedUser) return res.status(404).json({ message: "User or Project not found" });
            res.json(updatedUser);

        } else {
            // Add new - Check limit (10 items)
            const user = await User.findOne({ email });
            if (!user) return res.status(404).json({ message: "User not found" });

            if (user.projects && user.projects.length >= 10) {
                return res.status(400).json({ error: "Maximum limit of 10 projects reached" });
            }

            user.projects.push(projectObj);
            await user.save();
            res.json(user);
        }

    } catch (error) {
        console.error("Error saving project item:", error);
        res.status(500).json({ error: error.message });
    }
};

// Delete a single project by ID
exports.deleteUserProject = async (req, res) => {
    console.log("--> DELETE Project Requested");
    const { email } = req.user;
    const { projectId } = req.params;
    console.log(`User: ${email}, ProjectID: ${projectId}`);

    try {
        const mongoose = require('mongoose');
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            console.log("Invalid ID");
            return res.status(400).json({ message: "Invalid project ID" });
        }

        console.log("Executing $pull...");
        const updatedUser = await User.findOneAndUpdate(
            { email },
            { $pull: { projects: { _id: new mongoose.Types.ObjectId(projectId) } } },
            { new: true }
        );
        console.log("Update query finished.");

        if (!updatedUser) {
            console.log("User not found or nothing updated");
            return res.status(404).json({ message: "User not found or project not found" });
        }

        console.log("Delete Successful");
        res.json(updatedUser);
    } catch (error) {
        console.error("CRITICAL Error deleting project:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// Reorder projects
exports.reorderUserProjects = async (req, res) => {
    const { email } = req.user;
    const { projects } = req.body; // Expecting array of objects with _id

    try {
        if (!Array.isArray(projects)) {
            return res.status(400).json({ error: "Projects must be an array" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Create a map of the new order: ID -> Index
        const orderMap = new Map();
        projects.forEach((p, index) => {
            if (p._id) orderMap.set(p._id.toString(), index);
        });

        // Sort the user's existing projects based on the map
        user.projects.sort((a, b) => {
            const indexA = orderMap.has(a._id.toString()) ? orderMap.get(a._id.toString()) : 9999;
            const indexB = orderMap.has(b._id.toString()) ? orderMap.get(b._id.toString()) : 9999;
            return indexA - indexB;
        });

        await user.save();
        res.json(user);
    } catch (error) {
        console.error("Error reordering projects:", error);
        res.status(500).json({ error: error.message });
    }
};
