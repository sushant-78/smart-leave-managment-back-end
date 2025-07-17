const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validation");
const {
  login,
  getMe,
  logout,
  refreshToken,
} = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/login
router.post("/login", validateLogin, login);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

// POST /api/auth/logout
router.post("/logout", authMiddleware, logout);

// POST /api/auth/refresh
router.post("/refresh", authMiddleware, refreshToken);

module.exports = router;
