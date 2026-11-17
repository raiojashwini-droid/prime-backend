const express = require('express');
const router = express.Router();
const rentalsController = require('./rentals.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', rentalsController.listRentals);
router.get('/:id', rentalsController.getRental);
router.post('/', rentalsController.createRental);
router.put('/:id', rentalsController.updateRental);
router.delete('/:id', rentalsController.terminateRental);

module.exports = router;
