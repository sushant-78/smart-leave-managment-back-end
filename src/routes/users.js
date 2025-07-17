const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const {
  requireAdmin,
  requireOwnershipOrAdmin,
} = require("../middleware/roleCheck");
const { validateUserCreation } = require("../middleware/validation");
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUnassignedUsers,
  getManagers,
} = require("../controllers/userController");

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// GET /api/users - Get all users (Admin only)
router.get("/", requireAdmin, getAllUsers);

// GET /api/users/unassigned - Get unassigned users (Admin only)
router.get("/unassigned", requireAdmin, getUnassignedUsers);

// GET /api/users/managers - Get all managers (Admin only)
router.get("/managers", requireAdmin, getManagers);

// GET /api/users/:id - Get user by ID (Admin or own profile)
router.get("/:id", requireOwnershipOrAdmin, getUserById);

// POST /api/users - Create new user (Admin only)
router.post("/", requireAdmin, validateUserCreation, createUser);

// PUT /api/users/:id - Update user (Admin only)
router.put("/:id", requireAdmin, validateUserCreation, updateUser);

// DELETE /api/users/:id - Delete user (Admin only)
router.delete("/:id", requireAdmin, deleteUser);

module.exports = router;
