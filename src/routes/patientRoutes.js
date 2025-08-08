const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  createPatient,
  updatePatient,
  getPatient,
  getAllPatients,
  deletePatient,
  restorePatient,
} = require("../controllers/patient/patientController");
const {
  authenticateToken,
  requireEmailVerification,
  requireRole,
} = require("../middlewares/auth");

// Rate limiting for patient operations
const patientLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: "Too many patient requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(patientLimiter);

// Patient CRUD routes
router.post("/", createPatient);
router.get("/", getAllPatients);
router.get("/:id", getPatient);
router.put("/:id", updatePatient);
router.delete("/:id", deletePatient);
router.patch("/:id/restore", requireRole(["ADMIN"]), restorePatient);

module.exports = router;
