const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const permissionsController = require('./permissions.controller');
const { authenticate, requireRoles } = require('../../middlewares/auth');

router.use(authenticate);

// Current user permissions
router.get('/my-permissions', permissionsController.getMyPermissions);

// User listing, creation & details
router.get('/', requireRoles('owner', 'secondary_admin'), usersController.listUsers);
router.post('/', requireRoles('owner', 'secondary_admin'), usersController.createUser);
router.get('/:id', usersController.getUserById);

// Granular permissions matrix for a user
router.get('/:id/permissions', requireRoles('owner', 'secondary_admin'), permissionsController.getUserPermissions);
router.put('/:id/permissions', requireRoles('owner', 'secondary_admin'), permissionsController.updateUserPermissions);

module.exports = router;
