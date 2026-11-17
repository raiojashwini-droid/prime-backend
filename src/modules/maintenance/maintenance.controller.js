const maintenanceService = require('./maintenance.service');

async function getAllMaintenanceRecords(req, res, next) {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      vehicleId: req.query.vehicleId
    };
    const records = await maintenanceService.getAllMaintenanceRecords(filters);
    res.json({
      success: true,
      data: records,
      meta: { total: records.length }
    });
  } catch (err) {
    next(err);
  }
}

async function getMaintenanceStats(req, res, next) {
  try {
    const stats = await maintenanceService.getMaintenanceStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
}

async function getMaintenanceById(req, res, next) {
  try {
    const record = await maintenanceService.getMaintenanceById(req.params.id);
    res.json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
}

async function createMaintenanceRecord(req, res, next) {
  try {
    const userId = req.user ? req.user.id : null;
    const created = await maintenanceService.createMaintenanceRecord(req.body, userId);
    res.status(201).json({
      success: true,
      message: 'Maintenance work order scheduled successfully.',
      data: created
    });
  } catch (err) {
    next(err);
  }
}

async function updateMaintenanceRecord(req, res, next) {
  try {
    const updated = await maintenanceService.updateMaintenanceRecord(req.params.id, req.body);
    res.json({
      success: true,
      message: 'Maintenance work order updated successfully.',
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteMaintenanceRecord(req, res, next) {
  try {
    const result = await maintenanceService.deleteMaintenanceRecord(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
}

async function toggleVehicleAvailability(req, res, next) {
  try {
    const result = await maintenanceService.toggleVehicleAvailability(
      req.params.vehicleId,
      req.body.status
    );
    res.json({
      success: true,
      message: `Vehicle ${result.plate} status updated to ${result.currentStatus}.`,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllMaintenanceRecords,
  getMaintenanceStats,
  getMaintenanceById,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
  toggleVehicleAvailability
};
