const jwt = require("jsonwebtoken");
const { JWT_CONFIG } = require("../config/auth");
const { User } = require("../models");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_CONFIG.secret);

    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.expiresIn,
  });
};

module.exports = {
  authMiddleware,
  generateToken,
};
