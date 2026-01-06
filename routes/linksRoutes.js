const express = require("express");
const app = express();
const router = express.Router();
const LinksController = require("../controllers/links.controller");
const isAuthenticated = require('../middlewares/isAuthenticated');
const { linksLimiter } = require('../Limiting/linksLimiter');

// Links Request Routes
router.get('/:email', isAuthenticated, LinksController.getLinkByEmail);
router.post('/', isAuthenticated, linksLimiter, LinksController.createLink);
router.put('/:id', isAuthenticated, linksLimiter, LinksController.updateLink);
router.delete('/:id', isAuthenticated, LinksController.deleteLink);

module.exports = router;
