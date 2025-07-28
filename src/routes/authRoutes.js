const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { register } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController");
const { logout } = require("../controllers/auth/logoutController");
const { verifyEmail } = require("../controllers/auth/verifyEmailController");
const { refreshToken } = require("../controllers/auth/refreshTokenController");
const {
  requestPasswordReset,
  resetPassword,
} = require("../controllers/auth/passwordResetController");
const { getProfile } = require("../controllers/auth/profileController");
const { authenticateToken } = require("../middlewares/auth");
const {
  validateRequest,
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
} = require("../middlewares/validation");

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: "Too many OTP requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  register
);
router.post("/login", authLimiter, validateRequest(loginSchema), login);
router.post(
  "/verify-email",
  otpLimiter,
  validateRequest(verifyEmailSchema),
  verifyEmail
);
router.post("/refresh-token", refreshToken);
router.post(
  "/request-password-reset",
  otpLimiter,
  validateRequest(passwordResetRequestSchema),
  requestPasswordReset
);
router.post(
  "/reset-password",
  authLimiter,
  validateRequest(passwordResetSchema),
  resetPassword
);

// Protected routes
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
