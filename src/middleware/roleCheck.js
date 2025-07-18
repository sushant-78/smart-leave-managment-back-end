const { ROLES } = require("../config/auth");

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

const requireEmployee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  next();
};

const requireOwnershipOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.id) || parseInt(req.params.userId);

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (req.user.id !== targetUserId) {
    return res.status(403).json({
      success: false,
      message: "Access denied. You can only access your own data.",
    });
  }

  next();
};

const requireTeamAccessOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.id) || parseInt(req.params.userId);

  if (!targetUserId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required.",
    });
  }

  if (req.user.role === ROLES.ADMIN) {
    return next();
  }

  if (req.user.role === ROLES.MANAGER) {
    if (req.user.id === targetUserId) {
      return res.status(403).json({
        success: false,
        message: "Managers cannot approve their own leaves.",
      });
    }

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
        return res.status(500).json({
          success: false,
          message: "Internal server error.",
        });
      });
    return;
  }

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
