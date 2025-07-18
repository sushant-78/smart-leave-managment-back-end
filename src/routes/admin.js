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
const { getManagers } = require("../controllers/userController");
const { getAdminManagerTeamLeaves } = require("../controllers/leaveController");

const router = express.Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get("/dashboard", getDashboardStats);

router.get("/config/current", getCurrentSystemConfig);

router.get("/config/:year", getSystemConfig);

router.post("/config", validateSystemConfig, setSystemConfig);

router.post("/config/:year/holidays", updateHolidays);

router.post("/config/:year/working-days", updateWorkingDays);

router.post("/config/:year/leave-types", updateLeaveTypes);

router.get("/pending-leaves/:manager_id", getPendingLeavesByManager);

router.get("/managers", getManagers);

router.get("/managers/leaves", getAdminManagerTeamLeaves);

module.exports = router;
