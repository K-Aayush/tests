const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { expressMiddleware } = require("@apollo/server/express4");
const { initializeKeyRotation } = require("./config/jwt");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const keyRotationRoutes = require("./routes/keyRotationRoutes");
const patientRoutes = require("./routes/patientRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const practitionerRoutes = require("./routes/practitionerRoutes");
const taskRoutes = require("./routes/taskRoutes");
const consentRoutes = require("./routes/consentRoutes");
const conditionRoutes = require("./routes/conditionRoutes");
const { createApolloServer, createContext } = require("./graphql/server");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

const app = express();

// Initialize JWT key rotation
initializeKeyRotation().catch(console.error);

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
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

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/keys", keyRotationRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/practitioners", practitionerRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/conditions", conditionRoutes);
app.use("/api/consents", consentRoutes);

const startGraphQLServer = async () => {
  const apolloServer = createApolloServer();
  await apolloServer.start();

  app.use(
    "/graphql",
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    }),
    express.json(),
    expressMiddleware(apolloServer, {
      context: createContext,
    })
  );

  console.log("GraphQL server ready at /graphql");
};

startGraphQLServer().catch(console.error);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
