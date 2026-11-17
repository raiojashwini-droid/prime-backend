const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticate, requireRoles } = require('../../middlewares/auth');

router.use(authenticate);

router.get('/', requireRoles('owner', 'secondary_admin'), usersController.listUsers);
router.get('/:id', usersController.getUserById);

module.exports = router;
