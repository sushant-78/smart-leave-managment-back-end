const { User, Leave, SystemConfig, AuditLog, sequelize } = require("../models");
const { ACTION_TYPES, ROLES } = require("../config/auth");

const getUserDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentYear = new Date().getFullYear();

    const systemConfig = await SystemConfig.getConfigByYear(currentYear);

    const leaveBalances = [];
    const standardLeaveTypes = ["casual", "sick", "earned"];

    for (const type of standardLeaveTypes) {
      const total = systemConfig?.leave_types?.[type] || 0;

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
        usedLeaves += systemConfig.getWorkingDaysBetween(
          leave.from_date,
          leave.to_date
        );
      }

      leaveBalances.push({
        type,
        total: total,
        used: usedLeaves,
        remaining: Math.max(0, total - usedLeaves),
      });
    }

    const latestPendingRequest = await Leave.findOne({
      where: {
        created_by: userId,
        status: "pending",
      },
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
              attributes: ["id", "name", "email", "role"],
            },
            {
              model: User,
              as: "reportees",
              attributes: ["id", "name", "email", "role"],
            },
          ],
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        currentYear,
        systemConfig: systemConfig || {},
        leaveBalances,
        latestPendingRequest: latestPendingRequest || {},
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role = "", search = "" } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (role) whereClause.role = role;
    if (search) {
      whereClause[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { email: { [sequelize.Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        users,
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

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "reportees",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role, manager_id } = req.body;

    if (manager_id) {
      const manager = await User.findByPk(manager_id);
      if (!manager || manager.role !== ROLES.MANAGER) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager assignment",
        });
      }
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      manager_id,
    });

    await AuditLog.logAction(req.user.id, "user", user.id.toString(), "create");

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, manager_id } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    if (
      role &&
      role !== user.role &&
      user.role === ROLES.MANAGER &&
      role === ROLES.EMPLOYEE
    ) {
      await User.update(
        { manager_id: null },
        { where: { manager_id: user.id } }
      );
    }

    if (manager_id !== undefined) {
      if (manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager || manager.role !== ROLES.MANAGER) {
          return res.status(400).json({
            success: false,
            message: "Invalid manager assignment",
          });
        }
        if (parseInt(manager_id) === parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: "User cannot be their own manager",
          });
        }
      }
    }

    const oldData = { ...user.toJSON() };
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (manager_id !== undefined) updateData.manager_id = manager_id;

    await user.update(updateData);

    await AuditLog.logAction(req.user.id, "user", user.id.toString(), "update");

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    if (user.role === ROLES.MANAGER) {
      await User.update(
        { manager_id: null },
        { where: { manager_id: user.id } }
      );
    }

    await AuditLog.logAction(req.user.id, "user", user.id.toString(), "delete");

    await user.destroy();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getUnassignedUsers = async (req, res) => {
  try {
    const users = await User.findUnassignedUsers();

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getManagers = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const systemConfig = await SystemConfig.getConfigByYear(currentYear);

    const managers = await User.findAll({
      where: {
        role: ROLES.MANAGER,
      },
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "manager_id",
        "created_at",
        "updated_at",
      ],
      order: [["name", "ASC"]],
    });

    const managersWithBalances = await Promise.all(
      managers.map(async (manager) => {
        const leaveBalances = {};

        const standardLeaveTypes = ["casual", "sick", "earned"];

        for (const type of standardLeaveTypes) {
          const total = systemConfig?.leave_types?.[type] || 0;

          const approvedLeaves = await Leave.findAll({
            where: {
              created_by: manager.id,
              type: type,
              status: "approved",
            },
            attributes: ["from_date", "to_date"],
          });

          let usedLeaves = 0;
          for (const leave of approvedLeaves) {
            usedLeaves += systemConfig.getWorkingDaysBetween(
              leave.from_date,
              leave.to_date
            );
          }

          leaveBalances[type] = {
            total: total,
            used: usedLeaves,
            remaining: Math.max(0, total - usedLeaves),
          };
        }

        return {
          ...manager.toJSON(),
          leave_balances: leaveBalances,
        };
      })
    );

    res.json({
      success: true,
      message: "Managers retrieved successfully",
      data: {
        managers: managersWithBalances,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getAssignedUsers = async (req, res) => {
  try {
    const managerId = req.user.id;
    const currentYear = new Date().getFullYear();

    const systemConfig = await SystemConfig.getConfigByYear(currentYear);

    const assignedUsers = await User.findAll({
      where: {
        manager_id: managerId,
        role: ROLES.EMPLOYEE,
      },
      attributes: [
        "id",
        "name",
        "email",
        "role",
        "manager_id",
        "created_at",
        "updated_at",
      ],
      order: [["name", "ASC"]],
    });

    const usersWithBalances = await Promise.all(
      assignedUsers.map(async (user) => {
        const leaveBalances = {};

        const standardLeaveTypes = ["casual", "sick", "earned"];

        for (const type of standardLeaveTypes) {
          const total = systemConfig?.leave_types?.[type] || 0;

          const approvedLeaves = await Leave.findAll({
            where: {
              created_by: user.id,
              type: type,
              status: "approved",
            },
            attributes: ["from_date", "to_date"],
          });

          let usedLeaves = 0;
          for (const leave of approvedLeaves) {
            usedLeaves += systemConfig.getWorkingDaysBetween(
              leave.from_date,
              leave.to_date
            );
          }

          leaveBalances[type] = {
            total: total,
            used: usedLeaves,
            remaining: Math.max(0, total - usedLeaves),
          };
        }

        return {
          ...user.toJSON(),
          leave_balances: leaveBalances,
        };
      })
    );

    res.json({
      success: true,
      message: "Assigned users retrieved successfully",
      data: {
        users: usersWithBalances,
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
  getUserDashboard,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUnassignedUsers,
  getManagers,
  getAssignedUsers,
};
