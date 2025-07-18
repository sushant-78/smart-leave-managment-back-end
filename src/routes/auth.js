const express = require("express");
const { authMiddleware } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validation");
const { login, getMe, logout } = require("../controllers/authController");

const router = express.Router();

router.post("/login", validateLogin, login);

router.get("/me", authMiddleware, getMe);

router.post("/logout", authMiddleware, logout);

module.exports = router;
