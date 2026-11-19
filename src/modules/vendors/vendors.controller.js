const vendorsService = require('./vendors.service');

async function getAllVendors(req, res, next) {
  try {
    const { search, category, status } = req.query;
    const result = await vendorsService.getAllVendors({ search, category, status });
    return res.status(200).json({
      success: true,
      data: result.vendors,
      stats: result.stats
    });
  } catch (err) {
    next(err);
  }
}

async function getVendorById(req, res, next) {
  try {
    const vendor = await vendorsService.getVendorById(req.params.id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: { message: `Vendor "${req.params.id}" not found`, code: 'NOT_FOUND' }
      });
    }
    return res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (err) {
    next(err);
  }
}

async function createVendor(req, res, next) {
  try {
    const { name, contact } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        error: { message: 'Vendor name is required', code: 'VALIDATION_ERROR' }
      });
    }
    const newVendor = await vendorsService.createVendor(req.body);
    return res.status(201).json({
      success: true,
      data: newVendor
    });
  } catch (err) {
    next(err);
  }
}

async function updateVendor(req, res, next) {
  try {
    const updated = await vendorsService.updateVendor(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Vendor "${req.params.id}" not found`, code: 'NOT_FOUND' }
      });
    }
    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

async function deleteVendor(req, res, next) {
  try {
    const result = await vendorsService.deleteVendor(req.params.id);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
}

async function reactivateVendor(req, res, next) {
  try {
    const updated = await vendorsService.reactivateVendor(req.params.id);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: { message: `Vendor "${req.params.id}" not found`, code: 'NOT_FOUND' }
      });
    }
    return res.status(200).json({
      success: true,
      message: `Vendor ${updated.name} reactivated successfully to Active Partner.`,
      data: updated
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  reactivateVendor
};
