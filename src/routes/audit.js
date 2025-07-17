const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const {
  getAllAuditLogs,
  getMyAuditLogs,
  getAuditLogsByUser,
} = require("../controllers/auditController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/audit - Get all audit logs (Admin only)
router.get("/", requireAdmin, getAllAuditLogs);

// GET /api/audit/me - Get own audit logs (All users)
router.get("/me", getMyAuditLogs);

// GET /api/audit/user/:id - Get audit logs for specific user (Admin only)
router.get("/user/:id", requireAdmin, getAuditLogsByUser);

module.exports = router;
