const express = require('express');
const router = express.Router();
const documentsController = require('./documents.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', documentsController.listDocuments);
router.get('/:id', documentsController.getDocument);
router.post('/', documentsController.createDocument);
router.delete('/:id', documentsController.deleteDocument);

module.exports = router;
