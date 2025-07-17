const { User, AuditLog } = require("../models");
const { generateToken } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validation");
const { ACTION_TYPES } = require("../config/auth");

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Log login action
    await AuditLog.logAction(user.id, "user_login", user.id.toString());

    // Email simulation
    console.log(`Email to ${user.email}: Welcome back ${user.name}!`);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get current user profile
const getMe = async (req, res) => {
  try {
    const user = req.user;

    // Get user with manager info
    const userWithManager = await User.findByPk(user.id, {
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        user: userWithManager,
      },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Logout user
const logout = async (req, res) => {
  try {
    const user = req.user;

    // Log logout action
    await AuditLog.logAction(user.id, "user_logout", user.id.toString());

    // Email simulation
    console.log(`Email to ${user.email}: Goodbye ${user.name}!`);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh token (optional - for future use)
const refreshToken = async (req, res) => {
  try {
    const user = req.user;
    const newToken = generateToken(user.id);

    res.json({
      success: true,
      data: {
        token: newToken,
      },
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  login,
  getMe,
  logout,
  refreshToken,
};
