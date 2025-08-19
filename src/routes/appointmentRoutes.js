const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const {
  createAppointment,
} = require("../controllers/appointment/createAppointment");
const {
  getAppointment,
  getAllAppointments,
  getPatientAppointments,
} = require("../controllers/appointment/getAppointment");
const {
  updateAppointment,
} = require("../controllers/appointment/updateAppointment");
const {
  deleteAppointment,
} = require("../controllers/appointment/deleteAppointment");
const {
  restoreAppointment,
} = require("../controllers/appointment/restoreAppointment");
const {
  cancelAppointment,
} = require("../controllers/appointment/cancelAppointment");
const {
  completeAppointment,
} = require("../controllers/appointment/completeAppointment");
const {
  authenticateToken,
  requireEmailVerification,
  requireRole,
} = require("../middlewares/auth");

// Rate limiting for appointment operations
const appointmentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many appointment requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(appointmentLimiter);

// Appointment CRUD routes
router.post("/", createAppointment);
router.get("/", getAllAppointments);
router.get("/:id", getAppointment);
router.get("/external/:externalId", getAppointment);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

// Patient-specific appointment routes
router.get("/patient/:patientId", getPatientAppointments);
router.get("/patient/external/:patientExternalId", getPatientAppointments);

// Appointment status management routes
router.patch("/:id/cancel", cancelAppointment);
router.patch("/:id/complete", completeAppointment);
router.patch("/:id/restore", requireRole(["ADMIN"]), restoreAppointment);

module.exports = router;
