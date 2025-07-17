const { ROLES } = require("../config/auth");

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }

  next();
};

// Middleware to check if user is manager
const requireManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== ROLES.MANAGER && req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Manager role required.",
    });
  }

  next();
};

// Middleware to check if user is employee or higher
const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // All authenticated users are employees or higher
  next();
};

// Middleware to check if user can access their own data or is admin
const requireOwnershipOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.id) || parseInt(req.params.userId);

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  // Admin can access any user's data
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  // Users can only access their own data
  if (req.user.id !== targetUserId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    });
  }

  next();
};

// Middleware to check if user can manage their team or is admin
const requireTeamAccessOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.id) || parseInt(req.params.userId);

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  // Admin can access any user's data
  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  // Manager can only access their team members' data
  if (req.user.role === ROLES.MANAGER) {
    // Check if target user is a reportee
    if (req.user.id === targetUserId) {
      return res.status(403).json({
        success: false,
        message: "Managers cannot approve their own leaves.",
      });
    }

    // Check if target user is assigned to this manager
    const { User } = require("../models");
    User.findByPk(targetUserId)
      .then((targetUser) => {
        if (!targetUser || targetUser.manager_id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: "Access denied. You can only manage your team members.",
          });
        }
        next();
      })
      .catch((error) => {
        console.error("Team access check error:", error);
        return res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      });
    return;
  }

  // Employees can only access their own data
  if (req.user.id !== targetUserId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requireManager,
  requireEmployee,
  requireOwnershipOrAdmin,
  requireTeamAccessOrAdmin,
};
