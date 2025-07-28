const app = require("./src/app");
const prisma = require("./prisma/client");
const { initializeKeyRotation } = require("./src/config/jwt");

const PORT = process.env.PORT || 4000;

async function startServer() {
  try {
    // Initialize JWT key rotation service
    await initializeKeyRotation();

    await prisma.$connect();
    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Auth API: http://localhost:${PORT}/api/auth`);
      console.log(`Key Rotation API: http://localhost:${PORT}/api/keys`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
