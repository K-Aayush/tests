require("dotenv").config();

const { app, setupGraphQL, setupErrorHandling } = require("./src/app");
const prisma = require("./prisma/client");

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ============================================================================
// SERVER INITIALIZATION
// ============================================================================

async function initializeServices() {
  const services = [];

  try {
    // Initialize database connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");
    services.push("Database");

    // Initialize JWT key rotation (if service exists)
    try {
      const { initializeKeyRotation } = require("./src/config/jwt");
      await initializeKeyRotation();
      console.log("✅ JWT key rotation service initialized");
      services.push("JWT Key Rotation");
    } catch (error) {
      console.warn(
        "⚠️  JWT key rotation service not available:",
        error.message
      );
    }

    // Initialize GraphQL
    const graphqlSuccess = await setupGraphQL();
    if (graphqlSuccess) {
      services.push("GraphQL");
    }

    return services;
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    throw error;
  }
}

async function startServer() {
  try {
    console.log("🚀 Starting CareDevi Backend Server...");
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`🔧 Port: ${PORT}`);

    // Initialize all services
    const initializedServices = await initializeServices();

    // Setup error handling (must be after all routes/middleware)
    setupErrorHandling();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log("\n" + "=".repeat(60));
      console.log("🎉 CareDevi Backend Server is running!");
      console.log("=".repeat(60));
      console.log(`🌐 Server URL: http://localhost:${PORT}`);
      console.log(`📊 Health Check: http://localhost:${PORT}/health`);

      if (initializedServices.includes("GraphQL")) {
        console.log(`🔗 GraphQL Endpoint: http://localhost:${PORT}/graphql`);
        console.log(`🛠️  GraphQL Playground: http://localhost:${PORT}/graphql`);
      }

      console.log("\n📋 Initialized Services:");
      initializedServices.forEach((service) => {
        console.log(`   ✅ ${service}`);
      });

      console.log("\n📌 API Endpoints:");
      console.log(`   🏠 Root: http://localhost:${PORT}/`);
      console.log(`   ❤️  Health: http://localhost:${PORT}/health`);

      if (initializedServices.includes("GraphQL")) {
        console.log(`   🔗 GraphQL: http://localhost:${PORT}/graphql`);
      }

      console.log("=".repeat(60) + "\n");
    });

    return server;
  } catch (error) {
    console.error("💥 Failed to start server:", error);
    process.exit(1);
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown(signal) {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);

  try {
    // Close database connection
    await prisma.$disconnect();
    console.log("✅ Database connection closed");

    console.log("👋 Server shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// ============================================================================
// START SERVER
// ============================================================================

if (require.main === module) {
  startServer();
}

module.exports = { startServer, gracefulShutdown };
