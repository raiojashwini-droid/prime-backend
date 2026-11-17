const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middlewares/auth');

// Protect dashboard route with JWT authentication
router.use(authenticate);

router.get('/', dashboardController.getDashboard);

module.exports = router;
