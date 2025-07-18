const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { requireManager } = require("../middleware/roleCheck");
const { getManagerTeamLeaves } = require("../controllers/leaveController");
const {
  getAssignedUsers,
  getUserDashboard,
} = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", requireManager, getUserDashboard);

router.get("/users", requireManager, getAssignedUsers);

router.get("/leaves", requireManager, getManagerTeamLeaves);

module.exports = router;
