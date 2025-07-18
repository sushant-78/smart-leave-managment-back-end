const { User, Leave, SystemConfig, AuditLog, sequelize } = require("../models");
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
    const config = await SystemConfig.createYearlyConfig(
      year,
      {
        working_days_per_week,
        holidays,
        leave_types,
      },
      req.user.id
    );

    // Log configuration update
    await AuditLog.logAction(
      req.user.id,
      "system_config",
      year.toString(),
      "create"
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

// Update holidays for a specific year
const updateHolidays = async (req, res) => {
  try {
    const { year } = req.params;
    const { holidays } = req.body;

    // Validate holidays
    SystemConfig.validateHolidays(holidays);

    // Upsert configuration with holidays
    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        holidays,
      },
      req.user.id
    );

    // Log holiday update
    await AuditLog.logAction(
      req.user.id,
      "system_config",
      year.toString(),
      "update"
    );

    res.json({
      success: true,
      message: "Holidays updated successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Update holidays error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update working days for a specific year
const updateWorkingDays = async (req, res) => {
  try {
    const { year } = req.params;
    const { working_days_per_week } = req.body;

    // Validate working days
    if (![4, 5, 6].includes(working_days_per_week)) {
      return res.status(400).json({
        success: false,
        message: "Working days per week must be 4, 5, or 6",
      });
    }

    // Upsert configuration with working days
    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        working_days_per_week,
      },
      req.user.id
    );

    // Log working days update
    await AuditLog.logAction(
      req.user.id,
      "system_config",
      year.toString(),
      "update"
    );

    res.json({
      success: true,
      message: "Working days updated successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Update working days error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update leave types for a specific year
const updateLeaveTypes = async (req, res) => {
  try {
    const { year } = req.params;
    const { leave_types } = req.body;

    // Validate leave types
    SystemConfig.validateLeaveTypes(leave_types);

    // Upsert configuration with leave types
    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        leave_types,
      },
      req.user.id
    );

    // Log leave types update
    await AuditLog.logAction(
      req.user.id,
      "system_config",
      year.toString(),
      "update"
    );

    res.json({
      success: true,
      message: "Leave types updated successfully",
      data: { config },
    });
  } catch (error) {
    console.error("Update leave types error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
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
      return res.status(200).json({
        success: true,
        data: {
          config: null,
          message: `No configuration found for year ${year}. You can create one.`,
        },
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
    const currentYear = new Date().getFullYear();

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          config: null,
          message: `No configuration found for current year ${currentYear}. You can create one.`,
        },
      });
    }

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
  updateHolidays,
  updateWorkingDays,
  updateLeaveTypes,
  getPendingLeavesByManager,
  getSystemConfig,
  getCurrentSystemConfig,
};
