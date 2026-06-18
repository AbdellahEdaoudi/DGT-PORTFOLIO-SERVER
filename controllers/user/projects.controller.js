const User = require('../../models/User');
const sanitizeHtml = require('sanitize-html');
const cloudinary = require('../../utils/cloudinary');

// Helper: delete a Cloudinary image by its URL
const deleteCloudinaryImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
    try {
        const urlParts = imageUrl.split('/');
        const versionIndex = urlParts.findIndex(p => p.startsWith('v') && !isNaN(p.substring(1)));
        let publicId;
        if (versionIndex !== -1) {
            publicId = urlParts.slice(versionIndex + 1).join('/').split('.')[0];
        } else {
            publicId = urlParts.pop().split('.')[0];
        }
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error("Error deleting Cloudinary image:", err);
    }
};

// Save (Add or Update) a single project item
exports.saveUserProjectItem = async (req, res) => {
    const { email } = req.user;
    let item = req.body;

    try {
        // Handle image: file upload takes priority over URL in body
        let imageUrl = item.image ? item.image.trim().substring(0, 1000) : "";

        if (req.file) {
            if (req.file.size > 200 * 1024) {
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ error: "Image size must not exceed 200KB" });
            }
            // Upload new image to Cloudinary
            const uploaded = await cloudinary.uploader.upload(req.file.path, {
                folder: "Project_Images"
            });
            imageUrl = uploaded.secure_url;

            // Delete old image if updating an existing project
            if (item._id) {
                const user = await User.findOne({ email, "projects._id": item._id });
                const oldProject = user?.projects?.find(p => p._id.toString() === item._id);
                if (oldProject?.image) {
                    await deleteCloudinaryImage(oldProject.image);
                }
            }
        }

        // Sanitize input
        // Support both 'technologies' (JSON) and 'technologies[]' (FormData) keys
        const rawTechs = item['technologies[]'] || item.technologies;
        let techs = Array.isArray(rawTechs)
            ? rawTechs
                .map(t => (typeof t === "string" ? t.trim().substring(0, 20) : ""))
                .filter(t => t)
            : (typeof rawTechs === "string" && rawTechs
                ? [rawTechs.trim().substring(0, 20)]
                : []);

        const projectObj = {
            title: item.title ? item.title.trim().substring(0, 100) : "",
            description: item.description ? item.description.trim().substring(0, 2000) : "",
            link: item.link ? item.link.trim().substring(0, 1000) : "",
            image: imageUrl,
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

        // Fetch image URL before deleting (to clean up Cloudinary)
        const userBefore = await User.findOne({ email, "projects._id": new mongoose.Types.ObjectId(projectId) });
        const projectToDelete = userBefore?.projects?.find(p => p._id.toString() === projectId);

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

        // Clean up Cloudinary image after successful DB delete
        if (projectToDelete?.image) {
            await deleteCloudinaryImage(projectToDelete.image);
        }

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
