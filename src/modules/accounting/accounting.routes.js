const express = require('express');
const router = express.Router();
const accountingController = require('./accounting.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// Stats & KPIs
router.get('/stats', accountingController.getStats);

// Charges
router.get('/charges', accountingController.listCharges);
router.post('/charges', accountingController.createCharge);

// Payments
router.get('/payments', accountingController.listPayments);
router.post('/payments', accountingController.createPayment);

// Deposits
router.get('/deposits', accountingController.listDeposits);
router.post('/deposits', accountingController.createDeposit);
router.post('/deposits/release/:id', accountingController.releaseDeposit);

// Refunds
router.get('/refunds', accountingController.listRefunds);
router.post('/refunds', accountingController.createRefund);

// Credits
router.get('/credits', accountingController.listCredits);
router.post('/credits', accountingController.createCredit);

// Invoices
router.get('/invoices', accountingController.listInvoices);
router.post('/invoices', accountingController.createInvoice);

// Payables
router.get('/payables', accountingController.listPayables);
router.post('/payables', accountingController.createPayable);
router.put('/payables/:id/status', accountingController.updatePayableStatus);

// Balances
router.get('/balances', accountingController.listDriverBalances);
router.get('/driver-balances', accountingController.listDriverBalances);

// Vendors
router.get('/vendors', accountingController.listVendors);

// Reversals
router.post('/reversals', accountingController.reverseTransaction);

// Delete / Void
router.delete('/entries/:type/:id', accountingController.deleteEntry);

module.exports = router;
