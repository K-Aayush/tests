const rateLimit = require("express-rate-limit");
const prisma = require("../../prisma/client");

// Enhanced OTP rate limiting with database tracking
const createOTPLimiter = (type, windowMs = 60 * 1000, max = 3) => {
  return rateLimit({
    windowMs,
    max,
    keyGenerator: (req) => {
      return `${req.ip}:${req.body.email || "unknown"}:${type}`;
    },
    handler: async (req, res) => {
      // Log the attempt
      try {
        await prisma.oTPAttempt.create({
          data: {
            email: req.body.email || "unknown",
            type,
            ipAddress: req.ip,
            userAgent: req.get("User-Agent"),
          },
        });
      } catch (error) {
        console.error("Failed to log OTP attempt:", error);
      }

      res.status(429).json({
        success: false,
        message: `Too many ${type} attempts. Please try again later.`,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Password reset rate limiting - more restrictive
const passwordResetLimiter = createOTPLimiter(
  "password_reset",
  15 * 60 * 1000,
  3
); // 3 attempts per 15 minutes

// Email verification rate limiting
const emailVerificationLimiter = createOTPLimiter(
  "verification",
  5 * 60 * 1000,
  5
); // 5 attempts per 5 minutes

// General OTP limiter for other operations
const generalOTPLimiter = createOTPLimiter("general", 60 * 1000, 3); // 3 attempts per minute

// Login attempt rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  keyGenerator: (req) => {
    return `login:${req.ip}:${req.body.email || "unknown"}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try again later.",
      retryAfter: 900, // 15 minutes in seconds
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiting
const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  keyGenerator: (req) => req.ip,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again later.",
      retryAfter: 3600,
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  passwordResetLimiter,
  emailVerificationLimiter,
  generalOTPLimiter,
  loginLimiter,
  registrationLimiter,
};
