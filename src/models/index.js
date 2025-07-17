const User = require("./User");
const Leave = require("./Leave");
const LeaveBalance = require("./LeaveBalance");
const AuditLog = require("./AuditLog");
const SystemConfig = require("./SystemConfig");

// Set up associations
const models = {
  User,
  Leave,
  LeaveBalance,
  AuditLog,
  SystemConfig,
};

// Initialize associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  User,
  Leave,
  LeaveBalance,
  AuditLog,
  SystemConfig,
  sequelize: require("../config/database").sequelize,
};
