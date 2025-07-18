const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/roleCheck");
const { getAllAuditLogs } = require("../controllers/auditController");

const router = express.Router();

router.use(authMiddleware);

router.get("/", requireAdmin, getAllAuditLogs);

module.exports = router;
