const { AuditLog, User } = require('../models');
const { ROLES } = require('../config/auth');

// Admin: Get all audit logs (with optional filters)
const getAllAuditLogs = async (req, res) => {
  try {
    const { user_id, action_type, start_date, end_date, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (user_id) where.action_by = user_id;
    if (action_type) where.action_type = action_type;
    if (start_date && end_date) {
      where.timestamp = {
        [AuditLog.sequelize.Op.between]: [new Date(start_date), new Date(end_date)]
      };
    } else if (start_date) {
      where.timestamp = {
        [AuditLog.sequelize.Op.gte]: new Date(start_date)
      };
    } else if (end_date) {
      where.timestamp = {
        [AuditLog.sequelize.Op.lte]: new Date(end_date)
      };
    }

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
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
      where: { action_by: userId },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get my audit logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Admin: Get audit logs for a specific user
const getAuditLogsByUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: logs } = await AuditLog.findAndCountAll({
      where: { action_by: id },
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get audit logs by user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllAuditLogs,
  getMyAuditLogs,
  getAuditLogsByUser
}; 