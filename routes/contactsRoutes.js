const express = require("express");
const app = express();
const ContacteController = require("../controllers/contacte.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');
const { contactLimiter } = require('../Limiting/contactLimiter');

// Contacts Request Routes
app.get('/',isAuthenticated, ContacteController.getContacts);
app.get('/:id', isAuthenticated, ContacteController.getContactById);
app.post('/', isAuthenticated,contactLimiter,ContacteController.createContact);
app.put('/:id', isAuthenticated, ContacteController.updateContactById);


module.exports = app;
