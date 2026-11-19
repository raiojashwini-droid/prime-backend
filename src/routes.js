const express = require('express');
const router = express.Router();
const db = require('./config/db');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const vehiclesRoutes = require('./modules/vehicles/vehicles.routes');
const driversRoutes = require('./modules/drivers/drivers.routes');
const rentalsRoutes = require('./modules/rentals/rentals.routes');
const insuranceRoutes = require('./modules/insurance/insurance.routes');
const accountingRoutes = require('./modules/accounting/accounting.routes');
const vendorsRoutes = require('./modules/vendors/vendors.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');
const tollsRoutes = require('./modules/tolls_tickets/tolls.routes');
const inspectionsRoutes = require('./modules/inspections/inspections.routes');
const paperworkRoutes = require('./modules/employee_paperwork/employee_paperwork.routes');
const documentsRoutes = require('./modules/documents/documents.routes');
const settingsRoutes = require('./modules/settings/settings.routes');

router.get('/health', async (req, res, next) => {
  try {
    await db.raw('SELECT 1');
    return res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        db: 'connected'
      }
    });
  } catch (error) {
    return next({
      status: 503,
      message: 'Database connection failed: ' + error.message,
      code: 'DB_UNAVAILABLE'
    });
  }
});

// Mount domain routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/drivers', driversRoutes);
router.use('/rentals', rentalsRoutes);
router.use('/insurance', insuranceRoutes);
router.use('/accounting', accountingRoutes);
router.use('/vendors', vendorsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/tolls', tollsRoutes);
router.use('/tolls-tickets', tollsRoutes);
router.use('/inspections', inspectionsRoutes);
router.use('/paperwork', paperworkRoutes);
router.use('/employee-paperwork', paperworkRoutes);
router.use('/documents', documentsRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
