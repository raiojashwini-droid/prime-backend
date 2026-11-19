const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/general', settingsController.getGeneralSettings);
router.put('/general', settingsController.updateGeneralSettings);
router.post('/general', settingsController.updateGeneralSettings);
router.get('/', settingsController.getAllSettings);

module.exports = router;
