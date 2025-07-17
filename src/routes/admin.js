const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const { validateSystemConfig } = require("../middleware/validation");
const {
  getDashboardStats,
  setSystemConfig,
  lockSystemConfig,
  resetLeaveBalances,
  getPendingLeavesByManager,
  getSystemConfig,
  getCurrentSystemConfig,
} = require("../controllers/adminController");

const router = express.Router();

// All routes require admin authentication
router.use(authMiddleware);
router.use(requireAdmin);

// GET /api/admin/dashboard - Get dashboard statistics
router.get("/dashboard", getDashboardStats);

// GET /api/admin/config/current - Get current system configuration
router.get("/config/current", getCurrentSystemConfig);

// GET /api/admin/config/:year - Get system configuration for specific year
router.get("/config/:year", getSystemConfig);

// POST /api/admin/config - Set yearly system configuration
router.post("/config", validateSystemConfig, setSystemConfig);

// PUT /api/admin/config/:year/lock - Lock system configuration
router.put("/config/:year/lock", lockSystemConfig);

// POST /api/admin/reset-balances/:year - Reset leave balances for a year
router.post("/reset-balances/:year", resetLeaveBalances);

// GET /api/admin/pending-leaves/:manager_id - Get pending leaves by manager
router.get("/pending-leaves/:manager_id", getPendingLeavesByManager);

module.exports = router;
