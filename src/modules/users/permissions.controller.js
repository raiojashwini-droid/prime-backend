const prisma = require('../../config/prisma');

const PRIME_MODULES = [
  'Dashboard',
  'Employee Paperwork',
  'Vehicles',
  'Drivers',
  'Rentals',
  'Inspections',
  'Insurance & Compliance',
  'Accounting',
  'Vendors',
  'Maintenance',
  'Tolls & Tickets',
  'Documents',
  'Reports',
  'Users & Roles',
  'Settings',
  'Settings - General',
  'Settings - Audit Log',
  'Settings - Notifications',
  'Settings - Statuses & Categories'
];

// Helper to serialize BigInt
function serializePermission(p) {
  return {
    id: Number(p.id),
    userId: Number(p.user_id),
    moduleName: p.module,
    canView: Boolean(p.can_view),
    canAdd: Boolean(p.can_add),
    canEdit: Boolean(p.can_edit),
    canDelete: Boolean(p.can_delete)
  };
}

/**
 * GET /api/v1/users/my-permissions
 * Returns permissions for currently authenticated user
 */
async function getMyPermissions(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (req.user?.role === 'owner') {
      const fullPerms = PRIME_MODULES.map((m, idx) => ({
        id: idx + 1,
        userId: Number(userId),
        moduleName: m,
        canView: true,
        canAdd: true,
        canEdit: true,
        canDelete: true
      }));
      return res.status(200).json({ success: true, data: fullPerms });
    }

    const perms = await prisma.permissions.findMany({
      where: { user_id: BigInt(userId) },
      orderBy: { id: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: perms.map(serializePermission)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/users/:id/permissions
 * Returns all module permissions for a user, auto-healing any missing modules
 */
async function getUserPermissions(req, res, next) {
  try {
    const userId = BigInt(req.params.id);
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let existingPerms = await prisma.permissions.findMany({
      where: { user_id: userId }
    });

    const existingModules = new Set(existingPerms.map(p => p.module));
    const missingModules = PRIME_MODULES.filter(m => !existingModules.has(m));

    if (missingModules.length > 0) {
      const isOwnerOrSecondary = user.role === 'owner' || user.role === 'secondary_admin';
      const isReadOnly = user.role === 'readonly_manager';

      for (const mod of missingModules) {
        await prisma.permissions.create({
          data: {
            user_id: userId,
            module: mod,
            can_view: isOwnerOrSecondary || isReadOnly,
            can_add: isOwnerOrSecondary,
            can_edit: isOwnerOrSecondary,
            can_delete: user.role === 'owner'
          }
        });
      }

      existingPerms = await prisma.permissions.findMany({
        where: { user_id: userId }
      });
    }

    // Sort to match PRIME_MODULES order
    const sorted = PRIME_MODULES.map(m => {
      const found = existingPerms.find(p => p.module === m);
      return found ? serializePermission(found) : {
        id: 0,
        userId: Number(userId),
        moduleName: m,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          role: user.role
        },
        permissions: sorted
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/users/:id/permissions
 * Saves updated permissions matrix for a user
 */
async function updateUserPermissions(req, res, next) {
  try {
    const userId = BigInt(req.params.id);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ success: false, message: 'permissions array is required' });
    }

    for (const p of permissions) {
      const moduleName = p.moduleName || p.module;
      if (!moduleName) continue;

      const canView = Boolean(p.canView ?? p.can_view ?? false);
      const canAdd = Boolean(p.canAdd ?? p.can_add ?? false);
      const canEdit = Boolean(p.canEdit ?? p.can_edit ?? false);
      const canDelete = Boolean(p.canDelete ?? p.can_delete ?? false);

      await prisma.permissions.upsert({
        where: {
          user_id_module: {
            user_id: userId,
            module: moduleName
          }
        },
        update: {
          can_view: canView,
          can_add: canAdd,
          can_edit: canEdit,
          can_delete: canDelete
        },
        create: {
          user_id: userId,
          module: moduleName,
          can_view: canView,
          can_add: canAdd,
          can_edit: canEdit,
          can_delete: canDelete
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Permissions updated successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  PRIME_MODULES,
  getMyPermissions,
  getUserPermissions,
  updateUserPermissions
};
