const express = require('express');
const router = express.Router();
const tollsController = require('./tolls.controller');
const { authenticate } = require('../../middlewares/auth');

router.use(authenticate);

// KPI Stats
router.get('/stats', tollsController.getStats);

// Electronic E-ZPass Tolls
router.get('/electronic', tollsController.getAllTolls);
router.get('/ezpass', tollsController.getAllTolls);

// Review Workflow Action
router.patch('/tickets/:id/workflow', tollsController.updateWorkflow);

// Municipal Violation Tickets CRUD
router.get('/tickets', tollsController.getAllTickets);
router.get('/tickets/:id', tollsController.getTicketById);
router.post('/tickets', tollsController.createTicket);
router.put('/tickets/:id', tollsController.updateTicket);
router.delete('/tickets/:id', tollsController.deleteTicket);

// Direct root routes fallback
router.get('/', tollsController.getAllTickets);
router.post('/', tollsController.createTicket);
router.get('/:id', tollsController.getTicketById);
router.put('/:id', tollsController.updateTicket);
router.delete('/:id', tollsController.deleteTicket);

module.exports = router;
