const jwt = require("jsonwebtoken");
const keyRotationService = require("./keyRotation");

const JWT_CONFIG = {
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY,
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE,
};

const signAsync = (payload, secret, options) => {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, secret, options, (err, token) => {
      if (err) reject(err);
      else resolve(token);
    });
  });
};

const verifyAsync = (token, secret, options) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secret, options, (err, decoded) => {
      if (err) reject(err);
      else resolve(decoded);
    });
  });
};

const generateAccessToken = async (payload) => {
  try {
    const secret = keyRotationService.getCurrentAccessSecret();
    const keyVersion = keyRotationService.getCurrentKeyVersion();

    const tokenPayload = {
      ...payload,
      keyVersion,
    };

    return await signAsync(tokenPayload, secret, {
      expiresIn: JWT_CONFIG.accessTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    console.error("Access token generation error:", error);
    throw new Error("Failed to generate access token");
  }
};

const generateRefreshToken = async (payload) => {
  try {
    const secret = keyRotationService.getCurrentRefreshSecret();
    const keyVersion = keyRotationService.getCurrentKeyVersion();

    const tokenPayload = {
      ...payload,
      keyVersion,
    };

    return await signAsync(tokenPayload, secret, {
      expiresIn: JWT_CONFIG.refreshTokenExpiry,
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    console.error("Refresh token generation error:", error);
    throw new Error("Failed to generate refresh token");
  }
};

const verifyAccessToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    const keyVersion = decoded?.keyVersion;

    // Get the appropriate secret based on key version
    const secret = keyRotationService.getAccessSecretByVersion(keyVersion);

    // Verify with the correct secret
    return await verifyAsync(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    console.error("Access token verification error:", error);
    throw error;
  }
};

const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    const keyVersion = decoded?.keyVersion;

    // Get the appropriate secret based on key version
    const secret = keyRotationService.getRefreshSecretByVersion(keyVersion);

    // Verify with the correct secret
    return await verifyAsync(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    console.error("Refresh token verification error:", error);
    throw error;
  }
};

// Initialize key rotation service
const initializeKeyRotation = async () => {
  try {
    await keyRotationService.initialize();
    console.log("JWT Key Rotation initialized successfully");
  } catch (error) {
    console.error("Failed to initialize JWT Key Rotation:", error);
    throw error;
  }
};

// Get key rotation statistics (for admin endpoints)
const getKeyRotationStats = () => {
  return keyRotationService.getKeyStats();
};

// Force key rotation (for emergency situations)
const forceKeyRotation = async () => {
  return await keyRotationService.forceKeyRotation();
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  initializeKeyRotation,
  getKeyRotationStats,
  forceKeyRotation,
  JWT_CONFIG,
};
