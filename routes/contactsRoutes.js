const express = require("express");
const router = express.Router();
const ContacteController = require("../controllers/contacte.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');
const { contactLimiter } = require('../Limiting/contactLimiter');

// Contacts Request Routes
router.get('/user-contacts', isAuthenticated, ContacteController.getUserContacts);
router.delete('/user-contacts/:id', isAuthenticated, ContacteController.deleteUserContact);
router.post('/', isAuthenticated, contactLimiter, ContacteController.createContact);


module.exports = router;
