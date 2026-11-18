const vehiclesService = require('./vehicles.service');

async function listVehicles(req, res, next) {
  try {
    const list = await vehiclesService.getAllVehicles();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await vehiclesService.getVehicleById(req.params.id);
    return res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
}

async function createVehicle(req, res, next) {
  try {
    const created = await vehiclesService.createVehicle(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const updated = await vehiclesService.updateVehicle(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const result = await vehiclesService.deleteVehicle(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
