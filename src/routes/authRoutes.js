const express = require("express");
const router = express.Router();
const { register } = require("../controllers/auth/registerController");
const { login } = require("../controllers/auth/loginController");
const { logout } = require("../controllers/auth/logoutController");
const { verifyEmail } = require("../controllers/auth/verifyEmailController");
const { refreshToken } = require("../controllers/auth/refreshTokenController");
const {
  oauthLogin,
} = require("../controllers/auth/oauthController");

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
const {
  passwordResetLimiter,
  emailVerificationLimiter,
  loginLimiter,
  registrationLimiter,
} = require("../middlewares/rateLimiting");

// Public routes
router.post(
  "/register",
  registrationLimiter,
  validateRequest(registerSchema),
  register
);
router.post("/login", loginLimiter, validateRequest(loginSchema), login);
router.post(
  "/verify-email",
  emailVerificationLimiter,
  validateRequest(verifyEmailSchema),
  verifyEmail
);
router.post("/refresh-token", refreshToken);
router.post(
  "/request-password-reset",
  passwordResetLimiter,
  validateRequest(passwordResetRequestSchema),
  requestPasswordReset
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validateRequest(passwordResetSchema),
  resetPassword
);

// OAuth routes
router.post("/oauth/login", loginLimiter, oauthLogin);

// Protected routes
router.post("/logout", authenticateToken, logout);
router.get("/profile", authenticateToken, getProfile);

module.exports = router;
