const jwt = require("jsonwebtoken");

const JWT_CONFIG = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY,
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
};

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.accessTokenSecret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.refreshTokenSecret, {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.accessTokenSecret, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_CONFIG.refreshTokenSecret, {
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
  });
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
