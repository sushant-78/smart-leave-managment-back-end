const { User, Leave, SystemConfig, AuditLog, sequelize } = require("../models");
const { validateSystemConfig } = require("../middleware/validation");
const { ACTION_TYPES, LEAVE_STATUS } = require("../config/auth");

const getDashboardStats = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const totalUsers = await User.count();
    const totalEmployees = await User.count({ where: { role: "employee" } });
    const totalManagers = await User.count({ where: { role: "manager" } });

    const unassignedUsers = await User.findUnassignedUsers();

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

    const currentConfig = await SystemConfig.getCurrentYearConfig();

    const recentActivities = await AuditLog.getRecentActivity(10);

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const setSystemConfig = async (req, res) => {
  try {
    const { year, working_days_per_week, holidays, leave_types } = req.body;

    SystemConfig.validateHolidays(holidays);

    SystemConfig.validateLeaveTypes(leave_types);

    const existingConfig = await SystemConfig.getConfigByYear(year);
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: `Configuration for year ${year} already exists`,
      });
    }

    const config = await SystemConfig.createYearlyConfig(
      year,
      {
        working_days_per_week,
        holidays,
        leave_types,
      },
      req.user.id
    );

    await AuditLog.logAction(
      req.user.id,
      "system_config",
      year.toString(),
      "create"
    );

    res.status(201).json({
      success: true,
      message: "System configuration set successfully",
      data: { config },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateHolidays = async (req, res) => {
  try {
    const { year } = req.params;
    const { holidays } = req.body;

    SystemConfig.validateHolidays(holidays);

    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        holidays,
      },
      req.user.id
    );

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
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateWorkingDays = async (req, res) => {
  try {
    const { year } = req.params;
    const { working_days_per_week } = req.body;

    if (![4, 5, 6].includes(working_days_per_week)) {
      return res.status(400).json({
        success: false,
        message: "Working days per week must be 4, 5, or 6",
      });
    }

    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        working_days_per_week,
      },
      req.user.id
    );

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
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateLeaveTypes = async (req, res) => {
  try {
    const { year } = req.params;
    const { leave_types } = req.body;

    SystemConfig.validateLeaveTypes(leave_types);

    const config = await SystemConfig.upsertConfig(
      parseInt(year),
      {
        leave_types,
      },
      req.user.id
    );

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
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

const getPendingLeavesByManager = async (req, res) => {
  try {
    const { manager_id } = req.params;

    const manager = await User.findByPk(manager_id);
    if (!manager || manager.role !== "manager") {
      return res.status(404).json({
        success: false,
        message: "Manager not found",
      });
    }

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

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
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

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
