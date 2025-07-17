const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireManager, requireEmployee } = require("../middleware/roleCheck");
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
} = require("../controllers/leaveController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/leaves - Get all leaves (filtered by role)
router.get("/", getAllLeaves);

// GET /api/leaves/balance - Get user's leave balance
router.get("/balance", getLeaveBalance);

// GET /api/leaves/team - Get team leaves (Manager only)
router.get("/team", requireManager, getTeamLeaves);

// GET /api/leaves/:id - Get leave by ID
router.get("/:id", getLeaveById);

// POST /api/leaves - Apply for leave
router.post("/", requireEmployee, validateLeaveApplication, applyLeave);

// PUT /api/leaves/:id - Cancel leave (only pending)
router.put("/:id", requireEmployee, cancelLeave);

// PUT /api/leaves/:id/approve - Approve/reject leave (Manager/Admin only)
router.put("/:id/approve", requireManager, validateLeaveApproval, approveLeave);

module.exports = router;
