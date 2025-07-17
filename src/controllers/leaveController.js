const {
  Leave,
  LeaveBalance,
  User,
  SystemConfig,
  AuditLog,
} = require("../models");
const {
  validateLeave,
  validateLeaveApproval,
} = require("../middleware/validation");
const { LEAVE_STATUS, ACTION_TYPES } = require("../config/auth");

// Get all leaves (filtered by role)
const getAllLeaves = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = "",
      type = "",
      user_id = "",
    } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    if (user_id) whereClause.user_id = user_id;

    // Role-based filtering
    if (req.user.role === "employee") {
      whereClause.user_id = req.user.id;
    } else if (req.user.role === "manager") {
      // Get leaves from team members
      const teamUserIds = await User.findAll({
        where: { manager_id: req.user.id },
        attributes: ["id"],
      });
      whereClause.user_id = teamUserIds.map((u) => u.id);
    }
    // Admin can see all leaves

    const { count, rows: leaves } = await Leave.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        leaves,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get all leaves error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
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

    // Check access permissions
    if (req.user.role === "employee" && leave.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (req.user.role === "manager") {
      const teamUserIds = await User.findAll({
        where: { manager_id: req.user.id },
        attributes: ["id"],
      });
      if (!teamUserIds.find((u) => u.id === leave.user_id)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
    }

    res.json({
      success: true,
      data: { leave },
    });
  } catch (error) {
    console.error("Get leave by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { from_date, to_date, type, reason } = req.body;
    const userId = req.user.id;

    // Get current year config
    const currentYear = new Date().getFullYear();
    const config = await SystemConfig.getCurrentYearConfig();

    if (!config) {
      return res.status(400).json({
        success: false,
        message: "System configuration not set for current year",
      });
    }

    // Check for overlapping leaves
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

    // Calculate working days
    const workingDays = config.getWorkingDaysBetween(from_date, to_date);
    if (workingDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected dates contain no working days",
      });
    }

    // Check leave balance
    const balance = await LeaveBalance.findByUserTypeAndYear(
      userId,
      type,
      currentYear
    );
    if (!balance || balance.balance < workingDays) {
      return res.status(400).json({
        success: false,
        message: `Insufficient ${type} leave balance. Available: ${
          balance?.balance || 0
        }, Required: ${workingDays}`,
      });
    }

    // Create leave request
    const leave = await Leave.create({
      user_id: userId,
      from_date,
      to_date,
      type,
      reason,
      status: LEAVE_STATUS.PENDING,
    });

    // Log leave application
    await AuditLog.logAction(
      userId,
      ACTION_TYPES.LEAVE_APPLIED,
      leave.id.toString(),
      {
        leave_details: {
          from_date,
          to_date,
          type,
          reason,
          working_days: workingDays,
        },
      }
    );

    // Email simulation - notify manager
    const user = await User.findByPk(userId);
    const manager = user.manager_id
      ? await User.findByPk(user.manager_id)
      : null;

    if (manager) {
      console.log(
        `Email to ${manager.email}: Leave request from ${user.name} (${from_date} to ${to_date})`
      );
    } else {
      console.log(
        `Email to admin: Leave request from ${user.name} (${from_date} to ${to_date}) - No manager assigned`
      );
    }

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully",
      data: { leave },
    });
  } catch (error) {
    console.error("Apply leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Cancel leave (only pending leaves)
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

    // Check ownership
    if (leave.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own leaves",
      });
    }

    // Check if leave can be cancelled
    if (!leave.canBeCancelled()) {
      return res.status(400).json({
        success: false,
        message: "Only pending leaves can be cancelled",
      });
    }

    // Delete leave
    await leave.destroy();

    // Log leave cancellation
    await AuditLog.logAction(
      userId,
      ACTION_TYPES.LEAVE_CANCELLED,
      leave.id.toString(),
      {
        leave_details: {
          from_date: leave.from_date,
          to_date: leave.to_date,
          type: leave.type,
        },
      }
    );

    // Email simulation
    const user = await User.findByPk(userId);
    console.log(
      `Email to ${user.email}: Your leave request has been cancelled`
    );

    res.json({
      success: true,
      message: "Leave cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Approve/reject leave (Manager/Admin only)
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, manager_comment } = req.body;

    const leave = await Leave.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "role", "manager_id"],
        },
      ],
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    // Check if leave can be approved
    if (!leave.canBeApproved()) {
      return res.status(400).json({
        success: false,
        message: "Leave cannot be approved",
      });
    }

    // Check permissions
    if (req.user.role === "manager") {
      if (leave.user.manager_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "You can only approve leaves from your team members",
        });
      }
    }

    // Calculate working days for balance deduction
    const currentYear = new Date().getFullYear();
    const config = await SystemConfig.getCurrentYearConfig();
    const workingDays = config.getWorkingDaysBetween(
      leave.from_date,
      leave.to_date
    );

    // Update leave status
    await leave.update({
      status,
      manager_comment: manager_comment || null,
    });

    // Deduct balance if approved
    if (status === LEAVE_STATUS.APPROVED) {
      const balance = await LeaveBalance.findByUserTypeAndYear(
        leave.user_id,
        leave.type,
        currentYear
      );
      if (balance) {
        balance.deductBalance(workingDays);
        await balance.save();
      }
    }

    // Log approval/rejection
    const actionType =
      status === LEAVE_STATUS.APPROVED
        ? ACTION_TYPES.LEAVE_APPROVED
        : ACTION_TYPES.LEAVE_REJECTED;
    await AuditLog.logAction(req.user.id, actionType, leave.id.toString(), {
      leave_details: {
        from_date: leave.from_date,
        to_date: leave.to_date,
        type: leave.type,
      },
      manager_comment,
    });

    // Email simulation
    console.log(
      `Email to ${leave.user.email}: Your leave from ${leave.from_date} to ${leave.to_date} has been ${status}`
    );

    res.json({
      success: true,
      message: `Leave ${status} successfully`,
      data: { leave },
    });
  } catch (error) {
    console.error("Approve leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get leave balance
const getLeaveBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const balances = await LeaveBalance.findByUserAndYear(userId, currentYear);

    res.json({
      success: true,
      data: { balances },
    });
  } catch (error) {
    console.error("Get leave balance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get team leaves (Manager only)
const getTeamLeaves = async (req, res) => {
  try {
    const managerId = req.user.id;

    const leaves = await Leave.findByManager(managerId);

    res.json({
      success: true,
      data: { leaves },
    });
  } catch (error) {
    console.error("Get team leaves error:", error);
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
};
