const { AuditLog, User } = require("../models");

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllAuditLogs,
};
