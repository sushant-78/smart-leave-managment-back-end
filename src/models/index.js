const User = require("./User");
const Leave = require("./Leave");
const AuditLog = require("./AuditLog");
const SystemConfig = require("./SystemConfig");

// Set up associations
const models = {
  User,
  Leave,
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
  AuditLog,
  SystemConfig,
  sequelize: require("../config/database").sequelize,
};
