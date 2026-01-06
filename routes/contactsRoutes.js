const express = require("express");
const router = express.Router();
const ContacteController = require("../controllers/contacte.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');
const { contactLimiter } = require('../Limiting/contactLimiter');

// Contacts Request Routes
router.get('/', isAuthenticated, ContacteController.getContacts);
router.get('/:id', isAuthenticated, ContacteController.getContactById);
router.post('/', isAuthenticated, contactLimiter, ContacteController.createContact);
router.put('/:id', isAuthenticated, ContacteController.updateContactById);


module.exports = router;
