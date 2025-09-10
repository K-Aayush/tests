const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { createCondition } = require("../controllers/condition/createCondition");
const {
  getCondition,
  getAllConditions,
  getPatientConditions,
} = require("../controllers/condition/getCondition");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middlewares/auth");

// Rate limiting for condition operations
const conditionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many condition requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(conditionLimiter);

// Condition CRUD routes
router.post("/", createCondition);
router.get("/", getAllConditions);
router.get("/:id", getCondition);
router.get("/external/:externalId", getCondition);

// Patient-specific condition routes
router.get("/patient/:patientId", getPatientConditions);

module.exports = router;
