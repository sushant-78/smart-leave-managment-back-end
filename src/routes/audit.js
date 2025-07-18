const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const {
  getAllAuditLogs,
  getMyAuditLogs,
} = require("../controllers/auditController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/audit - Get all audit logs (Admin only)
// Query Parameters: page, limit, action_type
// Used by: Admin audit logs page
router.get("/", requireAdmin, getAllAuditLogs);

// GET /api/audit/me - Get own audit logs (All authenticated users)
// Query Parameters: page, limit
// Used by: User's own audit logs
router.get("/me", getMyAuditLogs);

module.exports = router;
