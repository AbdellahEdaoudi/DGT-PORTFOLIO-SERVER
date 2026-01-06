const express = require("express");
const router = express.Router();
const UserExperienceController = require("../../controllers/user/experience.controller");
const isAuthenticated = require('../../middlewares/isAuthenticated');

// Experience Routes
router.put("/update/experience/item", isAuthenticated, UserExperienceController.saveUserExperienceItem);
router.delete("/update/experience/:experienceId", isAuthenticated, UserExperienceController.deleteUserExperience);
router.put("/update/experience/order", isAuthenticated, UserExperienceController.reorderUserExperience);

module.exports = router;
