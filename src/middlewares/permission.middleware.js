const prisma = require('../config/prisma');

/**
 * Checks if the requesting user has permission for a specific module action.
 * @param {string} moduleName - e.g. 'Vehicles', 'Rentals', 'Accounting'
 * @param {'view' | 'add' | 'edit' | 'delete'} action
 */
function checkPermission(moduleName, action) {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return res.status(401).json({
          success: false,
          error: { message: 'Unauthorized: Authentication required', code: 'UNAUTHORIZED' }
        });
      }

      // Root Owner bypasses all checks
      if (user.role === 'owner') {
        return next();
      }

      const permission = await prisma.permissions.findFirst({
        where: {
          user_id: BigInt(user.id),
          module: moduleName
        }
      });

      if (!permission) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Access denied. You do not have permissions for the ${moduleName} section.`,
            code: 'FORBIDDEN'
          }
        });
      }

      let hasAccess = false;
      const act = action.toLowerCase();
      if (act === 'view') hasAccess = !!permission.can_view;
      else if (act === 'add') hasAccess = !!permission.can_add;
      else if (act === 'edit') hasAccess = !!permission.can_edit;
      else if (act === 'delete') hasAccess = !!permission.can_delete;

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: {
            message: `Permission denied. You are not authorized to ${act} in ${moduleName}.`,
            code: 'FORBIDDEN'
          }
        });
      }

      next();
    } catch (error) {
      console.error('Check Permission Middleware Error:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Internal server error checking permissions', code: 'INTERNAL_ERROR' }
      });
    }
  };
}

module.exports = {
  checkPermission
};
