const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

router.post('/validate-email-access-code', employeeController.validateEmailAccessCode);

module.exports = router;