const { User, AuditLog } = require("../models");
const { generateToken } = require("../middleware/auth");
const { validateLogin } = require("../middleware/validation");
const { ACTION_TYPES } = require("../config/auth");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user.id);

    await AuditLog.logAction(user.id, "auth", user.id.toString(), "login");

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
          manager_id: user.manager_id,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMe = async (req, res) => {
  try {
    const user = req.user;

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const logout = async (req, res) => {
  try {
    const user = req.user;

    await AuditLog.logAction(user.id, "auth", user.id.toString(), "logout");

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
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
};
