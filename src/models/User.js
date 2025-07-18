const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const { ROLES } = require("../config/auth");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255],
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM(ROLES.EMPLOYEE, ROLES.MANAGER),
      allowNull: false,
      defaultValue: ROLES.EMPLOYEE,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

User.prototype.toJSON = function () {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

User.findByEmail = function (email) {
  return this.findOne({ where: { email } });
};

User.findManagers = function () {
  return this.findAll({
    where: { role: ROLES.MANAGER },
    attributes: ["id", "name", "email"],
  });
};

User.findUnassignedUsers = function () {
  return this.findAll({
    where: {
      manager_id: null,
      role: ROLES.EMPLOYEE,
    },
    attributes: ["id", "name", "email", "role"],
  });
};

User.associate = (models) => {
  User.belongsTo(User, {
    as: "manager",
    foreignKey: "manager_id",
  });

  User.hasMany(User, {
    as: "reportees",
    foreignKey: "manager_id",
  });

  User.hasMany(models.Leave, {
    foreignKey: "created_by",
    as: "createdLeaves",
  });

  User.hasMany(models.Leave, {
    foreignKey: "manager_id",
    as: "managedLeaves",
  });

  User.hasMany(models.AuditLog, {
    foreignKey: "created_by",
    as: "auditLogs",
  });
};

module.exports = User;
