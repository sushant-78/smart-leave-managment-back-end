const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/roleCheck");
const {
  validateUserCreation,
  validateUserUpdate,
} = require("../middleware/validation");
const {
  getUserDashboard,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUnassignedUsers,
  getManagers,
} = require("../controllers/userController");

const router = express.Router();

router.use(authMiddleware);

router.get("/dashboard", getUserDashboard);

router.get("/", requireAdmin, getAllUsers);

router.get("/unassigned", requireAdmin, getUnassignedUsers);

router.get("/managers", requireAdmin, getManagers);

router.get("/:id", requireOwnershipOrAdmin, getUserById);

router.post("/", requireAdmin, validateUserCreation, createUser);

router.patch("/:id", requireAdmin, validateUserUpdate, updateUser);

router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;
