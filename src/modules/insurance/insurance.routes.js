const express = require('express');
const router = express.Router();
const insuranceController = require('./insurance.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// Stats & KPIs
router.get('/stats', insuranceController.getStats);

// Policies CRUD
router.get('/policies', insuranceController.listPolicies);
router.get('/policies/:id', insuranceController.getPolicy);
router.post('/policies', insuranceController.createPolicy);
router.put('/policies/:id', insuranceController.updatePolicy);
router.delete('/policies/:id', insuranceController.deletePolicy);

// Claims CRUD
router.get('/claims', insuranceController.listClaims);
router.get('/claims/:id', insuranceController.getClaim);
router.post('/claims', insuranceController.createClaim);
router.put('/claims/:id', insuranceController.updateClaim);
router.delete('/claims/:id', insuranceController.deleteClaim);
router.get('/accidents', insuranceController.listAccidents);

// Compliance Items
router.get('/compliance', insuranceController.listCompliance);
router.post('/compliance', insuranceController.createCompliance);
router.post('/compliance/renew/:id', insuranceController.renewCompliance);
router.delete('/compliance/:id', insuranceController.deleteCompliance);

module.exports = router;
