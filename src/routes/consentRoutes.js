const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { createConsent } = require("../controllers/consent/createConsent");
const {
  getConsent,
  getAllConsents,
  getPatientConsents,
  checkConsentForPurpose,
} = require("../controllers/consent/getConsent");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middlewares/auth");

// Rate limiting for consent operations
const consentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many consent requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(consentLimiter);

// Consent CRUD routes
router.post("/", createConsent);
router.get("/", getAllConsents);
router.get("/:id", getConsent);
router.get("/external/:externalId", getConsent);

// Patient-specific consent routes
router.get("/patient/:patientId", getPatientConsents);
router.get("/patient/:patientId/check", checkConsentForPurpose);

module.exports = router;
