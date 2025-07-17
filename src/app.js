const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config({ path: "./config.env" });

const {
  APP_CONFIG,
  CORS_OPTIONS,
  RATE_LIMIT_OPTIONS,
} = require("./config/app");
const { testConnection } = require("./config/database");
const { sequelize } = require("./models");

// Import routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const leaveRoutes = require("./routes/leaves");
const adminRoutes = require("./routes/admin");
const auditRoutes = require("./routes/audit");

const app = express();

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors(CORS_OPTIONS));

// Rate limiting
app.use(rateLimit(RATE_LIMIT_OPTIONS));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Leave Management System API is running",
    timestamp: new Date().toISOString(),
    environment: APP_CONFIG.nodeEnv,
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Global error handler:", error);

  // Sequelize validation errors
  if (error.name === "SequelizeValidationError") {
    const messages = error.errors.map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: messages,
    });
  }

  // Sequelize unique constraint errors
  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry found",
      field: error.errors[0].path,
    });
  }

  // JWT errors
  if (error.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (error.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(APP_CONFIG.nodeEnv === "development" && { stack: error.stack }),
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Database connection verified
    console.log("✅ Database connection established");

    // Start server
    app.listen(APP_CONFIG.port, () => {
      console.log(`🚀 Server running on port ${APP_CONFIG.port}`);
      console.log(`📊 Environment: ${APP_CONFIG.nodeEnv}`);
      console.log(`🔗 API Base URL: http://localhost:${APP_CONFIG.port}/api`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
