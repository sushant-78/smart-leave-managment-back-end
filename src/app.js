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

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const leaveRoutes = require("./routes/leaves");
const adminRoutes = require("./routes/admin");
const auditRoutes = require("./routes/audit");
const managerRoutes = require("./routes/managers");

const app = express();

app.use(helmet());

app.use(cors(CORS_OPTIONS));

app.use(rateLimit(RATE_LIMIT_OPTIONS));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  next();
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Smart Leave Management System API is running",
    timestamp: new Date().toISOString(),
    environment: APP_CONFIG.nodeEnv,
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use((error, req, res, next) => {
  if (error.name === "SequelizeValidationError") {
    const messages = error.errors.map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: messages,
    });
  }

  if (error.name === "SequelizeUniqueConstraintError") {
    return res.status(400).json({
      success: false,
      message: "Duplicate entry found",
      field: error.errors[0].path,
    });
  }

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

  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
    ...(APP_CONFIG.nodeEnv === "development" && { stack: error.stack }),
  });
});

const startServer = async () => {
  try {
    await testConnection();

    app.listen(APP_CONFIG.port, () => {});
  } catch (error) {
    process.exit(1);
  }
};

process.on("SIGTERM", async () => {
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await sequelize.close();
  process.exit(0);
});

startServer();

module.exports = app;
