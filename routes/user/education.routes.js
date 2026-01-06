const express = require("express");
const router = express.Router();
const UserEducationController = require("../../controllers/user/education.controller");
const isAuthenticated = require('../../middlewares/isAuthenticated');

// Education Routes
router.put("/update/education/item", isAuthenticated, UserEducationController.saveUserEducationItem);
router.delete("/update/education/:educationId", isAuthenticated, UserEducationController.deleteUserEducation);
router.put("/update/education/order", isAuthenticated, UserEducationController.reorderUserEducation);

module.exports = router;
