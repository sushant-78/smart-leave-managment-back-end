const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { LEAVE_TYPES } = require("../config/auth");

const LeaveBalance = sequelize.define(
  "LeaveBalance",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
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
    balance: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        isInt: true,
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        isInt: true,
        min: 2020,
        max: 2030,
      },
    },
  },
  {
    tableName: "leave_balances",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "type", "year"],
      },
    ],
  }
);

// Instance methods
LeaveBalance.prototype.hasSufficientBalance = function (requiredDays) {
  return this.balance >= requiredDays;
};

LeaveBalance.prototype.deductBalance = function (days) {
  if (this.balance >= days) {
    this.balance -= days;
    return true;
  }
  return false;
};

LeaveBalance.prototype.addBalance = function (days) {
  this.balance += days;
};

// Class methods
LeaveBalance.findByUserAndYear = function (userId, year) {
  return this.findAll({
    where: { user_id: userId, year },
    order: [["type", "ASC"]],
  });
};

LeaveBalance.findByUserTypeAndYear = function (userId, type, year) {
  return this.findOne({
    where: { user_id: userId, type, year },
  });
};

LeaveBalance.findOrCreateBalance = async function (
  userId,
  type,
  year,
  defaultBalance = 0
) {
  const [balance, created] = await this.findOrCreate({
    where: { user_id: userId, type, year },
    defaults: { balance: defaultBalance },
  });
  return balance;
};

LeaveBalance.resetBalancesForYear = async function (year, defaultBalances) {
  const users = await require("./User").findAll({
    attributes: ["id"],
  });

  const balancePromises = users.map((user) => {
    return Object.keys(defaultBalances).map((type) => {
      return this.findOrCreateBalance(
        user.id,
        type,
        year,
        defaultBalances[type]
      );
    });
  });

  return Promise.all(balancePromises.flat());
};

LeaveBalance.getUserBalances = function (userId, year) {
  return this.findAll({
    where: { user_id: userId, year },
    include: [
      {
        model: require("./User"),
        as: "user",
        attributes: ["id", "name", "email"],
      },
    ],
    order: [["type", "ASC"]],
  });
};

// Associations
LeaveBalance.associate = (models) => {
  LeaveBalance.belongsTo(models.User, {
    foreignKey: "user_id",
    as: "user",
  });
};

module.exports = LeaveBalance;
