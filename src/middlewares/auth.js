const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyAccessToken } = require('../services/tokenService');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = verifyAccessToken(token);
        const user = await db('users')
          .where({ id: decoded.userId })
          .select('id', 'name', 'email', 'role', 'status', 'phone', 'mfa_enabled', 'created_at', 'updated_at')
          .first();

        if (user && user.status === 'active') {
          req.user = user;
          return next();
        }
      } catch (tokenErr) {
        // Token invalid or expired - fallback to dev user if in development mode
      }
    }

    // Development mode fallback: auto-authenticate as system administrator
    if (process.env.NODE_ENV === 'development') {
      const devUser = await db('users').where({ id: 1 }).first();
      if (devUser) {
        req.user = devUser;
        return next();
      }
    }

    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication token missing, invalid, or expired',
        code: 'UNAUTHORIZED'
      }
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      try {
        const devUser = await db('users').where({ id: 1 }).first();
        if (devUser) {
          req.user = devUser;
          return next();
        }
      } catch (e) {}
    }
    next(error);
  }
}

function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          message: `Access denied. Requires one of roles: [${allowedRoles.join(', ')}]`,
          code: 'FORBIDDEN'
        }
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authenticateToken: authenticate,
  requireRoles
};
