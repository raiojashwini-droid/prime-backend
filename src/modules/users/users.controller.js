const usersService = require('./users.service');

async function listUsers(req, res, next) {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;
    const result = await usersService.getUsers({ page, limit, search, role, status, sortBy, sortOrder });

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getUserById(req, res, next) {
  try {
    const user = await usersService.getUserById(req.params.id);

    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await usersService.createUser(req.body);
    return res.status(201).json({
      success: true,
      message: 'User created successfully with default password 123456',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listUsers,
  getUserById,
  createUser
};
