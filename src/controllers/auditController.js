const { AuditLog, User } = require("../models");

// Admin: Get all audit logs (with optional filters)
const getAllAuditLogs = async (req, res) => {
  try {
    const { action_type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (action_type) where.action = action_type;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// User: Get own audit logs
const getMyAuditLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: { created_by: userId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get my audit logs error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllAuditLogs,
  getMyAuditLogs,
};
