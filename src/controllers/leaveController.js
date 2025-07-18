const { Leave, User, SystemConfig, AuditLog } = require("../models");
const {
  validateLeave,
  validateLeaveApproval,
} = require("../middleware/validation");
const { LEAVE_STATUS, ACTION_TYPES } = require("../config/auth");
const { Op } = require("sequelize");

const getAllLeaves = async (req, res) => {
  try {
    const { page, limit, year } = req.query;
    const offset = page ? (page - 1) * limit : 0;

    let whereClause = {};

    if (year) {
      whereClause.from_date = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    whereClause.created_by = req.user.id;

    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
          include: [
            {
              model: User,
              as: "manager",
              attributes: [
                "id",
                "name",
                "email",
                "role",
                "manager_id",
                "created_at",
                "updated_at",
              ],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = parseInt(offset);
    }

    const { count, rows: leaves } = await Leave.findAndCountAll(queryOptions);

    const response = {
      success: true,
      message: "Leaves retrieved successfully",
      data: {
        leaves: leaves,
      },
    };

    if (page && limit) {
      response.data.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (req.user.role === "employee" && leave.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.user.role === "manager" && leave.manager_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    res.json({
      success: true,
      data: { leave },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const applyLeave = async (req, res) => {
  try {
    const { from_date, to_date, type, reason } = req.body;
    const userId = req.user.id;

    const leaveYear = new Date(from_date).getFullYear();
    const yearConfig = await SystemConfig.getConfigByYear(leaveYear);

    if (!yearConfig) {
      return res.status(400).json({
        success: false,
        message: `System configuration not set for year ${leaveYear}`,
      });
    }

    const overlappingLeaves = await Leave.findOverlappingLeaves(
      userId,
      from_date,
      to_date
    );
    if (overlappingLeaves.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Leave dates overlap with existing approved or pending leaves",
      });
    }

    const workingDays = yearConfig.getWorkingDaysBetween(from_date, to_date);
    if (workingDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected dates contain no working days",
      });
    }

    const approvedLeaves = await Leave.findAll({
      where: {
        created_by: userId,
        type: type,
        status: "approved",
      },
      attributes: ["from_date", "to_date"],
    });

    let usedLeaves = 0;
    for (const leave of approvedLeaves) {
      usedLeaves += yearConfig.getWorkingDaysBetween(
        leave.from_date,
        leave.to_date
      );
    }

    const totalBalance = yearConfig.leave_types[type] || 0;
    const remainingBalance = totalBalance - usedLeaves;

    if (remainingBalance < workingDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${type} leave balance. Available: ${remainingBalance}, Required: ${workingDays}`,
      });
    }

    const user = await User.findByPk(userId);

    let managerId = null;
    if (user.role === "manager") {
      const adminUser = await User.findOne({
        where: { role: "admin" },
        attributes: ["id"],
      });
      managerId = adminUser ? adminUser.id : null;
    } else {
      managerId = user.manager_id;
    }

    const leave = await Leave.create({
      created_by: userId,
      manager_id: managerId,
      from_date,
      to_date,
      type,
      reason,
      status: LEAVE_STATUS.PENDING,
    });

    await AuditLog.logAction(userId, "leave", leave.id.toString(), "create");

    const manager = managerId ? await User.findByPk(managerId) : null;

    if (manager) {
    } else {
    }

    const createdLeave = await Leave.findByPk(leave.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
          include: [
            {
              model: User,
              as: "manager",
              attributes: [
                "id",
                "name",
                "email",
                "role",
                "manager_id",
                "created_at",
                "updated_at",
              ],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
        },
      ],
    });

    const transformedLeave = {
      id: createdLeave.id,
      created_by: createdLeave.created_by,
      manager_id: createdLeave.manager_id,
      from_date: createdLeave.from_date,
      to_date: createdLeave.to_date,
      type: createdLeave.type,
      reason: createdLeave.reason,
      status: createdLeave.status,
      manager_comment: createdLeave.manager_comment,
      created_at: createdLeave.created_at,
      updated_at: createdLeave.updated_at,
      user: createdLeave.creator,
      manager: createdLeave.manager,
    };

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: {
        leave: transformedLeave,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (leave.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leaves",
      });
    }

    if (!leave.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be cancelled",
      });
    }

    await leave.destroy();

    await AuditLog.logAction(userId, "leave", leave.id.toString(), "delete");

    const user = await User.findByPk(userId);

    res.json({
      success: true,
      message: "Leave cancelled successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, manager_comment } = req.body;

    const leave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    if (!leave.canBeApproved()) {
      return res.status(400).json({
        success: false,
        message: "Leave cannot be approved",
      });
    }

    if (req.user.role === "manager") {
      if (leave.manager_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only approve leaves assigned to you",
        });
      }
    }

    const currentYear = new Date().getFullYear();
    const config = await SystemConfig.getCurrentYearConfig();
    const workingDays = config.getWorkingDaysBetween(
      leave.from_date,
      leave.to_date
    );

    await leave.update({
      status,
      manager_comment: manager_comment || null,
    });

    const actionType = status === LEAVE_STATUS.APPROVED ? "approve" : "reject";
    await AuditLog.logAction(
      req.user.id,
      "leave",
      leave.id.toString(),
      actionType
    );

    res.json({
      success: true,
      message: `Leave ${status} successfully`,
      data: { leave },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const config = await SystemConfig.getCurrentYearConfig();
    if (!config) {
      return res.status(404).json({
        success: false,
        message: "System configuration not found for current year",
      });
    }

    res.json({
      success: true,
      data: {
        leave_types: config.leave_types,
        year: currentYear,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;

    const leaves = await Leave.findByManager(managerId);

    res.json({
      success: true,
      data: { leaves },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getManagerTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;
    const currentYear = new Date().getFullYear();

    const leaves = await Leave.findAll({
      where: {
        manager_id: managerId,
        from_date: {
          [Op.gte]: `${currentYear}-01-01`,
          [Op.lte]: `${currentYear}-12-31`,
        },
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formattedLeaves = leaves.map((leave) => ({
      id: leave.id,
      created_by: leave.created_by,
      manager_id: leave.manager_id,
      from_date: leave.from_date,
      to_date: leave.to_date,
      type: leave.type,
      reason: leave.reason,
      status: leave.status,
      manager_comment: leave.manager_comment,
      created_at: leave.created_at,
      updated_at: leave.updated_at,
      user: {
        id: leave.creator.id,
        name: leave.creator.name,
        email: leave.creator.email,
        role: leave.creator.role,
      },
    }));

    res.json({
      success: true,
      message: "Team leaves retrieved successfully",
      data: {
        leaves: formattedLeaves,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllLeavesAdmin = async (req, res) => {
  try {
    const { page, limit, year } = req.query;
    const offset = page ? (page - 1) * limit : 0;

    let whereClause = {};

    if (year) {
      whereClause.from_date = {
        [Op.gte]: `${year}-01-01`,
        [Op.lte]: `${year}-12-31`,
      };
    }

    const queryOptions = {
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
          include: [
            {
              model: User,
              as: "manager",
              attributes: [
                "id",
                "name",
                "email",
                "role",
                "manager_id",
                "created_at",
                "updated_at",
              ],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "manager_id",
            "created_at",
            "updated_at",
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    };

    if (page && limit) {
      queryOptions.limit = parseInt(limit);
      queryOptions.offset = parseInt(offset);
    }

    const { count, rows: leaves } = await Leave.findAndCountAll(queryOptions);

    const formattedLeaves = leaves.map((leave) => ({
      id: leave.id,
      created_by: leave.created_by,
      manager_id: leave.manager_id,
      from_date: leave.from_date,
      to_date: leave.to_date,
      type: leave.type,
      reason: leave.reason,
      status: leave.status,
      manager_comment: leave.manager_comment,
      created_at: leave.created_at,
      updated_at: leave.updated_at,
      employee: {
        id: leave.creator.id,
        name: leave.creator.name,
        email: leave.creator.email,
        role: leave.creator.role,
      },
      manager: leave.manager
        ? {
            id: leave.manager.id,
            name: leave.manager.name,
            email: leave.manager.email,
            role: leave.manager.role,
          }
        : null,
    }));

    const response = {
      success: true,
      message: "All leaves retrieved successfully",
      data: {
        leaves: formattedLeaves,
      },
    };

    if (page && limit) {
      response.data.pagination = {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / parseInt(limit)),
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAdminManagerTeamLeaves = async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year || new Date().getFullYear();

    const leaves = await Leave.findAll({
      where: {
        from_date: {
          [Op.gte]: `${currentYear}-01-01`,
          [Op.lte]: `${currentYear}-12-31`,
        },
      },
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "name", "email", "role"],
          where: {
            role: "manager",
          },
        },
      ],
      order: [["created_at", "DESC"]],
    });

    const formattedLeaves = leaves.map((leave) => ({
      id: leave.id,
      created_by: leave.created_by,
      manager_id: leave.manager_id,
      from_date: leave.from_date,
      to_date: leave.to_date,
      type: leave.type,
      reason: leave.reason,
      status: leave.status,
      manager_comment: leave.manager_comment,
      created_at: leave.created_at,
      updated_at: leave.updated_at,
      user: {
        id: leave.creator.id,
        name: leave.creator.name,
        email: leave.creator.email,
        role: leave.creator.role,
      },
    }));

    res.json({
      success: true,
      message: "All manager leaves retrieved successfully",
      data: {
        leaves: formattedLeaves,
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
  getAllLeaves,
  getLeaveById,
  applyLeave,
  cancelLeave,
  approveLeave,
  getLeaveBalance,
  getTeamLeaves,
  getManagerTeamLeaves,
  getAllLeavesAdmin,
  getAdminManagerTeamLeaves,
};
