const tollsService = require('./tolls.service');

async function getStats(req, res, next) {
  try {
    const stats = await tollsService.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

async function getAllTickets(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      vehicleId: req.query.vehicleId,
      driverId: req.query.driverId
    };
    const tickets = await tollsService.getAllTickets(filters);
    res.json({
      success: true,
      data: tickets,
      meta: { total: tickets.length }
    });
  } catch (err) {
    next(err);
  }
}

async function getAllTolls(req, res, next) {
  try {
    const tolls = await tollsService.getAllTolls({ search: req.query.search });
    res.json({
      success: true,
      data: tolls,
      meta: { total: tolls.length }
    });
  } catch (err) {
    next(err);
  }
}

async function getTicketById(req, res, next) {
  try {
    const ticket = await tollsService.getTicketById(req.params.id);
    res.json({
      success: true,
      data: ticket
    });
  } catch (err) {
    next(err);
  }
}

async function createTicket(req, res, next) {
  try {
    const created = await tollsService.createTicket(req.body);
    res.status(201).json({
      success: true,
      message: 'Citation notice registered successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function updateTicket(req, res, next) {
  try {
    const updated = await tollsService.updateTicket(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Citation notice updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteTicket(req, res, next) {
  try {
    const result = await tollsService.deleteTicket(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function updateWorkflow(req, res, next) {
  try {
    const { action, ...payload } = req.body;
    const updated = await tollsService.updateWorkflow(req.params.id, action, payload);
    res.json({
      success: true,
      message: `Violation ${req.params.id} review workflow updated to "${updated.status}".`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getStats,
  getAllTickets,
  getAllTolls,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  updateWorkflow
};
