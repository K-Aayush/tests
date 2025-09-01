const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  createPractitioner,
} = require("../controllers/practitioner/createPractitioner");
const {
  getPractitioner,
  getAllPractitioners,
} = require("../controllers/practitioner/getPractitioner");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middlewares/auth");

// Rate limiting for practitioner operations
const practitionerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many practitioner requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(practitionerLimiter);

// Practitioner CRUD routes
router.post("/", createPractitioner);
router.get("/", getAllPractitioners);
router.get("/:id", getPractitioner);
router.get("/npi/:npi", getPractitioner);

module.exports = router;
