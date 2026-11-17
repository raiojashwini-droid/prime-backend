const express = require('express');
const router = express.Router();
const vehiclesController = require('./vehicles.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', vehiclesController.listVehicles);
router.get('/:id', vehiclesController.getVehicle);
router.post('/', vehiclesController.createVehicle);
router.put('/:id', vehiclesController.updateVehicle);
router.delete('/:id', vehiclesController.deleteVehicle);

module.exports = router;
