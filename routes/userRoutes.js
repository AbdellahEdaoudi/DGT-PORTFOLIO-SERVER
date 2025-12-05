const express = require("express");
const app = express();
const UserController = require("../controllers/user.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');
const upload = require('../middlewares/multer');

// User Routes
app.get('/', isAuthenticated, UserController.getUsers);
app.get('/email/:email', isAuthenticated, UserController.getUserByEmail);
app.get('/username/:username', UserController.getUserByUsername);
app.get('/customdomain/:customDomain', UserController.getUserByCustomDomain);
app.get('/metauser/:username', UserController.getUserByUsernameMeta);
app.get('/metacustomdomain/:customDomain', UserController.getUserByCustomDomainMeta);
app.post('/', isAuthenticated, UserController.createUser);
// Update User Data
app.put('/:email', isAuthenticated, upload.single('urlimage'), UserController.updateUserByEmail);
app.put("/update/user-info", isAuthenticated, upload.single("urlimage"), UserController.UpUserInfo);
app.put("/update/about", isAuthenticated, UserController.UpUserAbout);
app.put("/update/bgcolor", isAuthenticated, UserController.UpUserBgColor);
app.put("/update/languages", isAuthenticated, UserController.UpUserLanguages);
app.put("/update/services", isAuthenticated, UserController.UpUserServices);
app.put("/update/skills", isAuthenticated, UserController.UpUserSkills);
app.put("/update/education", isAuthenticated, UserController.UpUserEducation);
app.put("/update/experience", isAuthenticated, UserController.UpUserExperience);
app.put("/update/projects", isAuthenticated, UserController.UpUserProjects);
app.put("/update/socials", isAuthenticated, UserController.UpUserSocials);
app.put("/update/theme", isAuthenticated, UserController.UpUserTheme);
app.put("/update/display-language", isAuthenticated, UserController.UpUserDisplayLanguage);
app.get('/active-usernames', UserController.getActiveUsernames);

module.exports = app;
