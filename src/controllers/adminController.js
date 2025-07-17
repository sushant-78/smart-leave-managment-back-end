const {
  User,
  Leave,
  LeaveBalance,
  SystemConfig,
  AuditLog,
  sequelize,
} = require("../models");
const { validateSystemConfig } = require("../middleware/validation");
const { ACTION_TYPES, LEAVE_STATUS } = require("../config/auth");

// Get admin dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get total users
    const totalUsers = await User.count();
    const totalEmployees = await User.count({ where: { role: "employee" } });
    const totalManagers = await User.count({ where: { role: "manager" } });

    // Get unassigned users
    const unassignedUsers = await User.findUnassignedUsers();

    // Get leave statistics
    const totalLeaves = await Leave.count();
    const pendingLeaves = await Leave.count({
      where: { status: LEAVE_STATUS.PENDING },
    });
    const approvedLeaves = await Leave.count({
      where: { status: LEAVE_STATUS.APPROVED },
    });
    const rejectedLeaves = await Leave.count({
      where: { status: LEAVE_STATUS.REJECTED },
    });

    // Get current year config
    const currentConfig = await SystemConfig.getCurrentYearConfig();

    // Get recent activities
    const recentActivities = await AuditLog.getRecentActivity(10);

    // Get leave type statistics
    const leaveTypeStats = await Leave.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["type"],
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          employees: totalEmployees,
          managers: totalManagers,
          unassigned: unassignedUsers.length,
        },
        leaves: {
          total: totalLeaves,
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves,
        },
        system: {
          currentYear,
          configSet: !!currentConfig,
          configLocked: currentConfig?.is_locked || false,
        },
        recentActivities,
        leaveTypeStats,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Set yearly system configuration
const setSystemConfig = async (req, res) => {
  try {
    const { year, working_days_per_week, holidays, leave_types } = req.body;

    // Validate holidays
    SystemConfig.validateHolidays(holidays);

    // Validate leave types
    SystemConfig.validateLeaveTypes(leave_types);

    // Check if config already exists
    const existingConfig = await SystemConfig.getConfigByYear(year);
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: `Configuration for year ${year} already exists`,
      });
    }

    // Create system config
    const config = await SystemConfig.createYearlyConfig(year, {
      working_days_per_week,
      holidays,
      leave_types,
    });

    // Log configuration update
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.CONFIG_UPDATED,
      year.toString(),
      {
        config_details: { working_days_per_week, holidays, leave_types },
      }
    );

    // Email simulation
    console.log(
      `Email to admin: System configuration for year ${year} has been set`
    );

    res.status(201).json({
      success: true,
      message: "System configuration set successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Set system config error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Lock system configuration
const lockSystemConfig = async (req, res) => {
  try {
    const { year } = req.params;

    const config = await SystemConfig.getConfigByYear(parseInt(year));
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuration for year ${year} not found`,
      });
    }

    if (config.is_locked) {
      return res.status(400).json({
        success: false,
        message: `Configuration for year ${year} is already locked`,
      });
    }

    // Lock configuration
    await config.update({ is_locked: true });

    // Log configuration lock
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.CONFIG_UPDATED,
      year.toString(),
      {
        action: "locked_configuration",
      }
    );

    // Email simulation
    console.log(
      `Email to admin: System configuration for year ${year} has been locked`
    );

    res.json({
      success: true,
      message: "System configuration locked successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Lock system config error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Reset leave balances for a year
const resetLeaveBalances = async (req, res) => {
  try {
    const { year } = req.params;

    // Get system config for the year
    const config = await SystemConfig.getConfigByYear(parseInt(year));
    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuration for year ${year} not found`,
      });
    }

    // Reset balances for all users
    await LeaveBalance.resetBalancesForYear(parseInt(year), config.leave_types);

    // Log balance reset
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.BALANCE_RESET,
      year.toString(),
      {
        reset_details: { year, leave_types: config.leave_types },
      }
    );

    // Email simulation
    console.log(
      `Email to all users: Leave balances for year ${year} have been reset`
    );

    res.json({
      success: true,
      message: "Leave balances reset successfully",
    });
  } catch (error) {
    console.error("Reset leave balances error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get pending leaves by manager
const getPendingLeavesByManager = async (req, res) => {
  try {
    const { manager_id } = req.params;

    // Verify manager exists
    const manager = await User.findByPk(manager_id);
    if (!manager || manager.role !== "manager") {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

    // Get pending leaves for manager's team
    const pendingLeaves = await Leave.findAll({
      where: { status: LEAVE_STATUS.PENDING },
      include: [
        {
          model: User,
          as: "user",
          where: { manager_id: manager_id },
          attributes: ["id", "name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: { pendingLeaves },
    });
  } catch (error) {
    console.error("Get pending leaves by manager error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get system configuration
const getSystemConfig = async (req, res) => {
  try {
    const { year } = req.params;
    const config = await SystemConfig.getConfigByYear(parseInt(year));

    if (!config) {
      return res.status(404).json({
        success: false,
        message: `Configuration for year ${year} not found`,
      });
    }

    res.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    console.error("Get system config error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get current system configuration
const getCurrentSystemConfig = async (req, res) => {
  try {
    const config = await SystemConfig.getCurrentYearConfig();

    res.json({
      success: true,
      data: { config },
    });
  } catch (error) {
    console.error("Get current system config error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getDashboardStats,
  setSystemConfig,
  lockSystemConfig,
  resetLeaveBalances,
  getPendingLeavesByManager,
  getSystemConfig,
  getCurrentSystemConfig,
};
