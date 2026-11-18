const express = require('express');
const router = express.Router();
const inspectionsController = require('./inspections.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// KPI Stats
router.get('/stats', inspectionsController.getInspectionStats);

// Accidents
router.get('/accidents', inspectionsController.getAllAccidents);
router.get('/accidents/:id', inspectionsController.getAccidentById);
router.post('/accidents', inspectionsController.createAccident);
router.put('/accidents/:id', inspectionsController.updateAccident);
router.delete('/accidents/:id', inspectionsController.deleteAccident);

// Inspections
router.get('/', inspectionsController.getAllInspections);
router.get('/:id', inspectionsController.getInspectionById);
router.post('/', inspectionsController.createInspection);
router.put('/:id', inspectionsController.updateInspection);
router.delete('/:id', inspectionsController.deleteInspection);

module.exports = router;
