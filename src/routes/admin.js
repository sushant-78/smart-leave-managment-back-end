const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const { validateSystemConfig } = require("../middleware/validation");
const {
  getDashboardStats,
  setSystemConfig,
  updateHolidays,
  updateWorkingDays,
  updateLeaveTypes,
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

// POST /api/admin/config/:year/holidays - Update holidays for a year
router.post("/config/:year/holidays", updateHolidays);

// POST /api/admin/config/:year/working-days - Update working days for a year
router.post("/config/:year/working-days", updateWorkingDays);

// POST /api/admin/config/:year/leave-types - Update leave types for a year
router.post("/config/:year/leave-types", updateLeaveTypes);

// GET /api/admin/pending-leaves/:manager_id - Get pending leaves by manager
router.get("/pending-leaves/:manager_id", getPendingLeavesByManager);

module.exports = router;
