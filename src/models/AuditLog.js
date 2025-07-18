const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const AuditLog = sequelize.define(
  "AuditLog",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    resource_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
  },
  {
    tableName: "audit_logs",
    timestamps: true,
    underscored: true,
  }
);

AuditLog.prototype.getFormattedTimestamp = function () {
  return this.created_at.toLocaleString();
};

AuditLog.logAction = async function (createdBy, resource, resourceId, action) {
  try {
    return await this.create({
      created_by: createdBy,
      resource,
      resource_id: resourceId,
      action,
    });
  } catch (error) {
    return null;
  }
};

AuditLog.findByUser = function (userId, limit = 50) {
  return this.findAll({
    where: { created_by: userId },
    order: [["created_at", "DESC"]],
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

AuditLog.findByAction = function (action, limit = 100) {
  return this.findAll({
    where: { action },
    order: [["created_at", "DESC"]],
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

AuditLog.findByResource = function (resource, limit = 100) {
  return this.findAll({
    where: { resource },
    order: [["created_at", "DESC"]],
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
      created_at: {
        [sequelize.Op.between]: [startDate, endDate],
      },
    },
    order: [["created_at", "DESC"]],
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
      "action",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
    ],
    group: ["action"],
    order: [[sequelize.fn("COUNT", sequelize.col("id")), "DESC"]],
  });

  return stats;
};

AuditLog.getRecentActivity = function (limit = 20) {
  return this.findAll({
    order: [["created_at", "DESC"]],
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

AuditLog.associate = (models) => {
  AuditLog.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "user",
  });
};

module.exports = AuditLog;
