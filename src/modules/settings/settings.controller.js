const settingsService = require('./settings.service');

async function getGeneralSettings(req, res, next) {
  try {
    const data = await settingsService.getGeneralSettings();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

async function updateGeneralSettings(req, res, next) {
  try {
    const updated = await settingsService.updateGeneralSettings(req.body);
    return res.status(200).json({
      success: true,
      data: updated,
      message: 'General settings saved successfully in database'
    });
  } catch (err) {
    next(err);
  }
}

async function getAllSettings(req, res, next) {
  try {
    const data = await settingsService.getAllSettings();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getAllSettings
};
