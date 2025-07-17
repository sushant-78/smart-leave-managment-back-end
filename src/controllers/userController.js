const { User, AuditLog, sequelize } = require("../models");
const { validateUser } = require("../middleware/validation");
const { ACTION_TYPES, ROLES } = require("../config/auth");

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", role = "" } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (search) {
      whereClause[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { email: { [sequelize.Op.like]: `%${search}%` } },
      ];
    }
    if (role) {
      whereClause.role = role;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "name", "email"],
        },
        {
          model: User,
          as: "reportees",
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
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user by ID
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
          attributes: ["id", "name", "email"],
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
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create new user (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, manager_id } = req.body;

    // Check if email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Validate manager assignment
    if (manager_id) {
      const manager = await User.findByPk(manager_id);
      if (!manager || manager.role !== ROLES.MANAGER) {
        return res.status(400).json({
          success: false,
          message: "Invalid manager assignment",
        });
      }
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      manager_id,
    });

    // Log user creation
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.USER_CREATED,
      user.id.toString(),
      {
        created_user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      }
    );

    // Email simulation
    console.log(
      `Email to ${user.email}: Welcome ${user.name}! Your account has been created.`
    );

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update user (Admin only)
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

    // Check if email already exists (if changing email)
    if (email && email !== user.email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Handle role change from manager to employee
    if (
      role &&
      role !== user.role &&
      user.role === ROLES.MANAGER &&
      role === ROLES.EMPLOYEE
    ) {
      // Unassign all reportees
      await User.update(
        { manager_id: null },
        { where: { manager_id: user.id } }
      );
    }

    // Validate manager assignment
    if (manager_id !== undefined) {
      if (manager_id) {
        const manager = await User.findByPk(manager_id);
        if (!manager || manager.role !== ROLES.MANAGER) {
          return res.status(400).json({
            success: false,
            message: "Invalid manager assignment",
          });
        }
        // Prevent circular assignment
        if (parseInt(manager_id) === parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: "User cannot be their own manager",
          });
        }
      }
    }

    // Update user
    const oldData = { ...user.toJSON() };
    await user.update({
      name: name || user.name,
      email: email || user.email,
      role: role || user.role,
      manager_id: manager_id !== undefined ? manager_id : user.manager_id,
    });

    // Log user update
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.USER_UPDATED,
      user.id.toString(),
      {
        old_data: oldData,
        new_data: user.toJSON(),
      }
    );

    // Email simulation
    console.log(`Email to ${user.email}: Your profile has been updated.`);

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete user (Admin only)
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

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    // Unassign reportees if user is a manager
    if (user.role === ROLES.MANAGER) {
      await User.update(
        { manager_id: null },
        { where: { manager_id: user.id } }
      );
    }

    // Log user deletion
    await AuditLog.logAction(
      req.user.id,
      ACTION_TYPES.USER_DELETED,
      user.id.toString(),
      {
        deleted_user: { id: user.id, name: user.name, email: user.email },
      }
    );

    // Email simulation
    console.log(`Email to ${user.email}: Your account has been deleted.`);

    // Delete user
    await user.destroy();

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get unassigned users (Admin only)
const getUnassignedUsers = async (req, res) => {
  try {
    const users = await User.findUnassignedUsers();

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    console.error("Get unassigned users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all managers (Admin only)
const getManagers = async (req, res) => {
  try {
    const managers = await User.findManagers();

    res.json({
      success: true,
      data: { managers },
    });
  } catch (error) {
    console.error("Get managers error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUnassignedUsers,
  getManagers,
};
