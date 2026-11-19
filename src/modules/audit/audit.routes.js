const express = require('express');
const router = express.Router();
const auditController = require('./audit.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/filters', auditController.getFilters);
router.get('/', auditController.getAuditLogs);
router.post('/', auditController.createAuditLog);
router.get('/export', auditController.exportAuditLogs);

module.exports = router;
