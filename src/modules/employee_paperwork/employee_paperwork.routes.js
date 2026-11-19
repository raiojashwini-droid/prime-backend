const express = require('express');
const router = express.Router();
const paperworkController = require('./employee_paperwork.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', paperworkController.getPaperwork);
router.post('/', paperworkController.savePaperwork);
router.get('/:id', paperworkController.getPaperworkById);
router.patch('/:id/review', paperworkController.reviewPaperwork);
router.post('/:id/review', paperworkController.reviewPaperwork);

module.exports = router;
