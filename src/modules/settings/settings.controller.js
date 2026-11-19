const settingsService = require('./settings.service');

async function getGeneralSettings(req, res, next) {
  try {
    const data = await settingsService.getGeneralSettings();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function updateGeneralSettings(req, res, next) {
  try {
    const data = await settingsService.updateGeneralSettings(req.body);
    return res.status(200).json({
      success: true,
      data,
      message: 'General settings saved successfully in database'
    });
  } catch (error) {
    next(error);
  }
}

async function getStatusesAndCategories(req, res, next) {
  try {
    const data = await settingsService.getStatusesAndCategories();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatusesAndCategories(req, res, next) {
  try {
    const data = await settingsService.updateStatusesAndCategories(req.body);
    return res.status(200).json({
      success: true,
      data,
      message: 'Statuses and categories updated successfully in database'
    });
  } catch (error) {
    next(error);
  }
}

async function addVehicleStatus(req, res, next) {
  try {
    const data = await settingsService.addVehicleStatus(req.body);
    return res.status(201).json({
      success: true,
      data,
      message: 'Vehicle status created in database'
    });
  } catch (error) {
    next(error);
  }
}

async function addExpenseCategory(req, res, next) {
  try {
    const data = await settingsService.addExpenseCategory(req.body);
    return res.status(201).json({
      success: true,
      data,
      message: 'Expense category created in database'
    });
  } catch (error) {
    next(error);
  }
}

async function addTicketStatus(req, res, next) {
  try {
    const data = await settingsService.addTicketStatus(req.body);
    return res.status(201).json({
      success: true,
      data,
      message: 'Ticket status created in database'
    });
  } catch (error) {
    next(error);
  }
}

async function getAllSettings(req, res, next) {
  try {
    const data = await settingsService.getAllSettings();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getStatusesAndCategories,
  updateStatusesAndCategories,
  addVehicleStatus,
  addExpenseCategory,
  addTicketStatus,
  getAllSettings
};
