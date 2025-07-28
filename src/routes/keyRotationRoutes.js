const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middlewares/auth");
const { getKeyRotationStats, forceKeyRotation } = require("../config/jwt");

// Rate limiting for key rotation endpoints
const keyRotationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5, 
  message: {
    success: false,
    message: "Too many key rotation requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get key rotation statistics (Admin only)
router.get(
  "/stats",
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req, res) => {
    try {
      const stats = getKeyRotationStats();

      res.json({
        success: true,
        message: "Key rotation statistics retrieved",
        data: stats,
      });
    } catch (error) {
      console.error("Get key stats error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get key rotation statistics",
      });
    }
  }
);

// Force key rotation (Admin only, emergency use)
router.post(
  "/rotate",
  keyRotationLimiter,
  authenticateToken,
  requireRole(["ADMIN"]),
  async (req, res) => {
    try {
      await forceKeyRotation();

      res.json({
        success: true,
        message: "Key rotation completed successfully",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Force key rotation error:", error);
      res.status(500).json({
        success: false,
        message: "Key rotation failed",
      });
    }
  }
);

// Health check for key rotation service
router.get("/health", async (req, res) => {
  try {
    const stats = getKeyRotationStats();
    const isHealthy = stats.currentVersion && stats.currentKeyCreatedAt;

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy
        ? "Key rotation service is healthy"
        : "Key rotation service issues detected",
      data: {
        healthy: isHealthy,
        currentVersion: stats.currentVersion,
        lastRotation: stats.currentKeyCreatedAt,
      },
    });
  } catch (error) {
    console.error("Key rotation health check error:", error);
    res.status(503).json({
      success: false,
      message: "Key rotation service health check failed",
    });
  }
});

module.exports = router;
