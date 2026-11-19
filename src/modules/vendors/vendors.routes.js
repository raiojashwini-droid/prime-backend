const express = require('express');
const router = express.Router();
const vendorsController = require('./vendors.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', vendorsController.getAllVendors);
router.get('/:id', vendorsController.getVendorById);
router.post('/', vendorsController.createVendor);
router.put('/:id', vendorsController.updateVendor);
router.patch('/:id', vendorsController.updateVendor);
router.post('/:id/reactivate', vendorsController.reactivateVendor);
router.patch('/:id/reactivate', vendorsController.reactivateVendor);
router.delete('/:id', vendorsController.deleteVendor);

module.exports = router;
