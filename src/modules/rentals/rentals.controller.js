const rentalsService = require('./rentals.service');

async function listRentals(req, res, next) {
  try {
    const list = await rentalsService.getAllRentals();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

async function getRental(req, res, next) {
  try {
    const rental = await rentalsService.getRentalById(req.params.id);
    return res.status(200).json({ success: true, data: rental });
  } catch (error) {
    next(error);
  }
}

async function createRental(req, res, next) {
  try {
    const created = await rentalsService.createRental(req.body);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
}

async function updateRental(req, res, next) {
  try {
    const updated = await rentalsService.updateRental(req.params.id, req.body);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}

async function terminateRental(req, res, next) {
  try {
    const result = await rentalsService.deleteRental(req.params.id);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listRentals,
  getRental,
  createRental,
  updateRental,
  terminateRental
};
