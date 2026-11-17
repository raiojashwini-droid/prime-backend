const express = require('express');
const router = express.Router();
const maintenanceController = require('./maintenance.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// Stats
router.get('/stats', maintenanceController.getMaintenanceStats);

// Vehicle availability toggle
router.patch('/vehicles/:vehicleId/availability', maintenanceController.toggleVehicleAvailability);

// CRUD
router.get('/', maintenanceController.getAllMaintenanceRecords);
router.get('/:id', maintenanceController.getMaintenanceById);
router.post('/', maintenanceController.createMaintenanceRecord);
router.put('/:id', maintenanceController.updateMaintenanceRecord);
router.delete('/:id', maintenanceController.deleteMaintenanceRecord);

module.exports = router;
