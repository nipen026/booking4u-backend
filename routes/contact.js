const express = require('express');
const { submitContactForm } = require('../controllers/contactController');
const router = express.Router();

router.post('/create', submitContactForm);

module.exports = router;
