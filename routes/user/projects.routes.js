const express = require("express");
const router = express.Router();
const UserProjectsController = require("../../controllers/user/projects.controller");
const isAuthenticated = require('../../middlewares/isAuthenticated');

// Project Routes
router.put("/update/project/item", isAuthenticated, UserProjectsController.saveUserProjectItem);
router.delete("/update/project/:projectId", isAuthenticated, UserProjectsController.deleteUserProject);
router.put("/update/projects/order", isAuthenticated, UserProjectsController.reorderUserProjects);

module.exports = router;
