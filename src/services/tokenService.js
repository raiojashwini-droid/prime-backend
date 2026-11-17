const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES || '15m'
  });
}

function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    jti: crypto.randomBytes(16).toString('hex')
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES || '7d'
  });
}

function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired access token');
    error.status = 401;
    error.code = 'INVALID_TOKEN';
    throw error;
  }
}

function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired refresh token');
    error.status = 401;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }
}

module.exports = {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
