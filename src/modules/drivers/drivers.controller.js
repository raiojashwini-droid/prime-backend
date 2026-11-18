const driversService = require('./drivers.service');

async function listDrivers(req, res, next) {
  try {
    const list = await driversService.getAllDrivers();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getDriver(req, res, next) {
  try {
    const driver = await driversService.getDriverById(req.params.id);
    return res.status(200).json({ success: true, data: driver });
  } catch (error) {
    next(error);
  }
}

async function createDriver(req, res, next) {
  try {
    const created = await driversService.createDriver(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function updateDriver(req, res, next) {
  try {
    const updated = await driversService.updateDriver(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteDriver(req, res, next) {
  try {
    const result = await driversService.deleteDriver(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver
};
