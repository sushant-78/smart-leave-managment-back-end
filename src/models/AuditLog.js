const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { ACTION_TYPES } = require("../config/auth");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    action_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    action_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [Object.values(ACTION_TYPES)],
      },
    },
    action_target: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "audit_logs",
    timestamps: false,
    indexes: [
      {
        fields: ["action_by"],
      },
      {
        fields: ["action_type"],
      },
      {
        fields: ["timestamp"],
      },
    ],
  }
);

// Instance methods
AuditLog.prototype.getFormattedTimestamp = function () {
  return this.timestamp.toLocaleString();
};

// Class methods
AuditLog.logAction = async function (
  actionBy,
  actionType,
  actionTarget,
  details = null
) {
  try {
    return await this.create({
      action_by: actionBy,
      action_type: actionType,
      action_target: actionTarget,
      details: details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging action:", error);
    // Don't throw error to prevent breaking main functionality
    return null;
  }
};

AuditLog.findByUser = function (userId, limit = 50) {
  return this.findAll({
    where: { action_by: userId },
    order: [["timestamp", "DESC"]],
    limit: limit,
    include: [
      {
        model: require("./User"),
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

AuditLog.findByActionType = function (actionType, limit = 100) {
  return this.findAll({
    where: { action_type: actionType },
    order: [["timestamp", "DESC"]],
    limit: limit,
    include: [
      {
        model: require("./User"),
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

AuditLog.findByDateRange = function (startDate, endDate, limit = 100) {
  return this.findAll({
    where: {
      timestamp: {
        [sequelize.Op.between]: [startDate, endDate],
      },
    },
    order: [["timestamp", "DESC"]],
    limit: limit,
    include: [
      {
        model: require("./User"),
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

AuditLog.getSystemStats = async function () {
  const stats = await this.findAll({
    attributes: [
      "action_type",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["action_type"],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
  });

  return stats;
};

AuditLog.getRecentActivity = function (limit = 20) {
  return this.findAll({
    order: [["timestamp", "DESC"]],
    limit: limit,
    include: [
      {
        model: require("./User"),
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

// Associations
AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.User, {
    foreignKey: "action_by",
    as: "user",
  });
};

module.exports = AuditLog;
