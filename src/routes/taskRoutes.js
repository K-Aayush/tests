const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { createTask } = require("../controllers/task/createTask");
const {
  getTask,
  getAllTasks,
  getTasksByPractitioner,
} = require("../controllers/task/getTask");
const {
  authenticateToken,
  requireEmailVerification,
} = require("../middlewares/auth");

// Rate limiting for task operations
const taskLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many task requests, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply authentication and email verification to all routes
router.use(authenticateToken);
router.use(requireEmailVerification);
router.use(taskLimiter);

// Task CRUD routes
router.post("/", createTask);
router.get("/", getAllTasks);
router.get("/:id", getTask);
router.get("/external/:externalId", getTask);

// Practitioner-specific task routes
router.get("/practitioner/:practitionerId", getTasksByPractitioner);

module.exports = router;
