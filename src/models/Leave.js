const { DataTypes, Op } = require("sequelize");
const { sequelize } = require("../config/database");
const { LEAVE_STATUS, LEAVE_TYPES } = require("../config/auth");

const Leave = sequelize.define(
  "Leave",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
    from_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
        isDate: true,
      },
    },
    to_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        notEmpty: true,
        isDate: true,
      },
    },
    type: {
      type: DataTypes.ENUM(Object.values(LEAVE_TYPES)),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [Object.values(LEAVE_TYPES)],
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    status: {
      type: DataTypes.ENUM(Object.values(LEAVE_STATUS)),
      allowNull: false,
      defaultValue: LEAVE_STATUS.PENDING,
      validate: {
        notEmpty: true,
        isIn: [Object.values(LEAVE_STATUS)],
      },
    },
    manager_comment: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 500],
      },
    },
  },
  {
    tableName: "leaves",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    hooks: {
      beforeValidate: (leave) => {
        if (leave.from_date && leave.to_date) {
          const fromDate = new Date(leave.from_date);
          const toDate = new Date(leave.to_date);
          if (toDate < fromDate) {
            throw new Error("To date cannot be before from date");
          }
        }
      },
    },
  }
);

Leave.prototype.getDuration = function () {
  const fromDate = new Date(this.from_date);
  const toDate = new Date(this.to_date);
  const diffTime = Math.abs(toDate - fromDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

Leave.prototype.canBeCancelled = function () {
  return this.status === LEAVE_STATUS.PENDING;
};

Leave.prototype.canBeApproved = function () {
  return this.status === LEAVE_STATUS.PENDING;
};

Leave.findPendingLeaves = function () {
  return this.findAll({
    where: { status: LEAVE_STATUS.PENDING },
    include: [
      {
        model: require("./User"),
        as: "creator",
        attributes: ["id", "name", "email", "role"],
      },
      {
        model: require("./User"),
        as: "manager",
        attributes: ["id", "name", "email", "role"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

Leave.findByUser = function (userId) {
  return this.findAll({
    where: { created_by: userId },
    include: [
      {
        model: require("./User"),
        as: "creator",
        attributes: ["id", "name", "email", "role"],
      },
      {
        model: require("./User"),
        as: "manager",
        attributes: ["id", "name", "email", "role"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

Leave.findByManager = function (managerId) {
  return this.findAll({
    where: { manager_id: managerId },
    include: [
      {
        model: require("./User"),
        as: "creator",
        attributes: ["id", "name", "email", "role"],
      },
      {
        model: require("./User"),
        as: "manager",
        attributes: ["id", "name", "email", "role"],
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

Leave.findOverlappingLeaves = function (
  userId,
  fromDate,
  toDate,
  excludeId = null
) {
  const whereClause = {
    created_by: userId,
    status: [LEAVE_STATUS.PENDING, LEAVE_STATUS.APPROVED],
    [Op.or]: [
      {
        from_date: {
          [Op.between]: [fromDate, toDate],
        },
      },
      {
        to_date: {
          [Op.between]: [fromDate, toDate],
        },
      },
      {
        [Op.and]: [
          { from_date: { [Op.lte]: fromDate } },
          { to_date: { [Op.gte]: toDate } },
        ],
      },
    ],
  };

  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }

  return this.findAll({ where: whereClause });
};

Leave.associate = (models) => {
  Leave.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });

  Leave.belongsTo(models.User, {
    foreignKey: "manager_id",
    as: "manager",
  });
};

module.exports = Leave;
