const { loginSchema, refreshTokenSchema } = require('./auth.validator');
const authService = require('./auth.service');

async function login(req, res, next) {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return res.status(400).json({
        success: false,
        error: {
          message: issue.message,
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await authService.login(parseResult.data);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getProfile(req.user.id);
    return res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const parseResult = refreshTokenSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Refresh token is required',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const result = await authService.refreshAccessToken(parseResult.data.refreshToken);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    await authService.logout(refreshToken);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Successfully logged out'
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  getMe,
  refreshToken,
  logout
};
