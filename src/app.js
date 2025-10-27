const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Apply rate limiting globally
app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ============================================================================
// HEALTH CHECK & INFO ROUTES
// ============================================================================

// Root endpoint - API information
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "CareDevi Backend API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    endpoints: {
      health: "/health",
      graphql: "/graphql",
      auth: "/api/auth",
      patients: "/api/patients",
      appointments: "/api/appointments",
      practitioners: "/api/practitioners",
      tasks: "/api/tasks",
      consents: "/api/consents",
      conditions: "/api/conditions",
    },
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    message: "Server is running normally",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================================
// API ROUTES (TODO: Uncomment when route files are created)
// ============================================================================

const authRoutes = require("./routes/authRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const practitionerRoutes = require("./routes/practitionerRoutes");
const taskRoutes = require("./routes/taskRoutes");
const consentRoutes = require("./routes/consentRoutes");
const conditionRoutes = require("./routes/conditionRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/practitioners", practitionerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/consents", consentRoutes);
app.use("/api/conditions", conditionRoutes);

// ============================================================================
// GRAPHQL SETUP FUNCTION
// ============================================================================

async function setupGraphQL() {
  try {
    console.log("🔄 Setting up GraphQL endpoint...");

    // Dynamic import to handle missing GraphQL dependencies gracefully
    const { expressMiddleware } = require("@apollo/server/express4");
    const { createApolloServer, createContext } = require("./graphql/server");

    const apolloServer = await createApolloServer();
    console.log("✅ Apollo GraphQL server created successfully");

    // Mount GraphQL endpoint with middleware
    app.use(
      "/graphql",
      cors({
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
      }),
      express.json({ limit: "50mb" }),
      expressMiddleware(apolloServer, {
        context: createContext,
      })
    );

    console.log("✅ GraphQL endpoint mounted at /graphql");
    return true;
  } catch (error) {
    console.error("❌ GraphQL setup failed:", error.message);
    console.warn("⚠️  Server will continue without GraphQL endpoint");
    return false;
  }
}

// ============================================================================
// ERROR HANDLING (Must be last)
// ============================================================================

function setupErrorHandling() {
  // 404 handler for unmatched routes
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  console.log("✅ Error handling middleware configured");
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  app,
  setupGraphQL,
  setupErrorHandling,
};
