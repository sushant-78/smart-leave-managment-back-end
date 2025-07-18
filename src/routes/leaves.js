const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  requireManager,
  requireEmployee,
  requireAdmin,
} = require("../middleware/roleCheck");
const {
  validateLeaveApplication,
  validateLeaveApproval,
} = require("../middleware/validation");
const {
  getAllLeaves,
  getLeaveById,
  applyLeave,
  cancelLeave,
  approveLeave,
  getLeaveBalance,
  getTeamLeaves,
  getAllLeavesAdmin,
} = require("../controllers/leaveController");

const router = express.Router();

router.use(authMiddleware);

router.get("/all", requireAdmin, getAllLeavesAdmin);

router.get("/", getAllLeaves);

router.get("/balance", getLeaveBalance);

router.get("/team", requireManager, getTeamLeaves);

router.get("/:id", getLeaveById);

router.post("/", validateLeaveApplication, applyLeave);

router.put("/:id", requireEmployee, cancelLeave);

router.put("/:id/approve", requireManager, validateLeaveApproval, approveLeave);

module.exports = router;
