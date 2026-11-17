const dashboardService = require('./dashboard.service');

async function getDashboard(req, res, next) {
  try {
    const { dateRange, vehicleFilter, driverFilter, categoryFilter } = req.query;
    const data = await dashboardService.getDashboardData({
      dateRange,
      vehicleFilter,
      driverFilter,
      categoryFilter
    });

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard
};
