const inspectionsService = require('./inspections.service');

async function getAllInspections(req, res, next) {
  try {
    const list = await inspectionsService.getAllInspections(req.query);
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function getInspectionById(req, res, next) {
  try {
    const item = await inspectionsService.getInspectionById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function createInspection(req, res, next) {
  try {
    const created = await inspectionsService.createInspection(req.body, req.user?.id || 1);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

async function updateInspection(req, res, next) {
  try {
    const updated = await inspectionsService.updateInspection(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteInspection(req, res, next) {
  try {
    const result = await inspectionsService.deleteInspection(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}

async function getAllAccidents(req, res, next) {
  try {
    const list = await inspectionsService.getAllAccidents();
    res.json({ success: true, data: list });
  } catch (err) {
    next(err);
  }
}

async function getAccidentById(req, res, next) {
  try {
    const item = await inspectionsService.getAccidentById(req.params.id);
    res.json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

async function createAccident(req, res, next) {
  try {
    const created = await inspectionsService.createAccident(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
}

async function updateAccident(req, res, next) {
  try {
    const updated = await inspectionsService.updateAccident(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteAccident(req, res, next) {
  try {
    const result = await inspectionsService.deleteAccident(req.params.id);
    res.json({ success: true, message: result.message });
  } catch (err) {
    next(err);
  }
}

async function getInspectionStats(req, res, next) {
  try {
    const stats = await inspectionsService.getInspectionStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  getAllAccidents,
  getAccidentById,
  createAccident,
  updateAccident,
  deleteAccident,
  getInspectionStats
};
