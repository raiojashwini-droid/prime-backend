const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// General settings
router.get('/general', settingsController.getGeneralSettings);
router.put('/general', settingsController.updateGeneralSettings);
router.post('/general', settingsController.updateGeneralSettings);

// Statuses & Categories
router.get('/statuses-categories', settingsController.getStatusesAndCategories);
router.put('/statuses-categories', settingsController.updateStatusesAndCategories);
router.post('/statuses-categories', settingsController.updateStatusesAndCategories);

// Specific additions, updates & deletions
router.post('/vehicle-statuses', settingsController.addVehicleStatus);
router.put('/vehicle-statuses/:id', settingsController.updateVehicleStatus);
router.delete('/vehicle-statuses/:id', settingsController.deleteVehicleStatus);

router.post('/expense-categories', settingsController.addExpenseCategory);
router.put('/expense-categories/:id', settingsController.updateExpenseCategory);
router.delete('/expense-categories/:id', settingsController.deleteExpenseCategory);

router.post('/ticket-statuses', settingsController.addTicketStatus);
router.put('/ticket-statuses/:id', settingsController.updateTicketStatus);
router.delete('/ticket-statuses/:id', settingsController.deleteTicketStatus);

// All raw settings
router.get('/', settingsController.getAllSettings);

module.exports = router;
