require("dotenv").config({ path: "./config.env" });

const APP_CONFIG = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

const CORS_OPTIONS = {
  origin: APP_CONFIG.corsOrigin,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

const RATE_LIMIT_OPTIONS = {
  windowMs: APP_CONFIG.rateLimitWindowMs,
  max: APP_CONFIG.rateLimitMaxRequests,
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
};

module.exports = {
  APP_CONFIG,
  CORS_OPTIONS,
  RATE_LIMIT_OPTIONS,
};
