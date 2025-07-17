const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const SystemConfig = sequelize.define(
  "SystemConfig",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isInt: true,
        min: 2020,
        max: 2030,
      },
    },
    working_days_per_week: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [[4, 5, 6]],
      },
    },
    holidays: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        isArray: true,
      },
    },
    leave_types: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      validate: {
        isObject: true,
      },
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "system_config",
    timestamps: true,
  }
);

// Instance methods
SystemConfig.prototype.canBeModified = function () {
  return !this.is_locked;
};

SystemConfig.prototype.lock = function () {
  this.is_locked = true;
};

SystemConfig.prototype.isHoliday = function (date) {
  const dateStr = date.toISOString().split("T")[0];
  return this.holidays.includes(dateStr);
};

SystemConfig.prototype.isWeekend = function (date) {
  const day = date.getDay();
  const workingDays = this.working_days_per_week;

  if (workingDays === 5) {
    return day === 0 || day === 6; // Sunday or Saturday
  } else if (workingDays === 4) {
    return day === 0 || day === 6 || day === 5; // Sunday, Saturday, Friday
  } else if (workingDays === 6) {
    return day === 0; // Only Sunday
  }

  return false;
};

SystemConfig.prototype.getWorkingDaysBetween = function (startDate, endDate) {
  let workingDays = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (!this.isHoliday(currentDate) && !this.isWeekend(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

// Class methods
SystemConfig.getCurrentYearConfig = function () {
  const currentYear = new Date().getFullYear();
  return this.findOne({
    where: { year: currentYear },
  });
};

SystemConfig.getConfigByYear = function (year) {
  return this.findOne({
    where: { year },
  });
};

SystemConfig.createYearlyConfig = async function (year, config) {
  const existingConfig = await this.findOne({ where: { year } });

  if (existingConfig) {
    throw new Error(`Configuration for year ${year} already exists`);
  }

  return this.create({
    year,
    working_days_per_week: config.working_days_per_week,
    holidays: config.holidays || [],
    leave_types: config.leave_types || {},
    is_locked: false,
  });
};

SystemConfig.updateConfig = async function (year, updates) {
  const config = await this.findOne({ where: { year } });

  if (!config) {
    throw new Error(`Configuration for year ${year} not found`);
  }

  if (config.is_locked) {
    throw new Error(
      `Configuration for year ${year} is locked and cannot be modified`
    );
  }

  return config.update(updates);
};

SystemConfig.lockConfig = async function (year) {
  const config = await this.findOne({ where: { year } });

  if (!config) {
    throw new Error(`Configuration for year ${year} not found`);
  }

  return config.update({ is_locked: true });
};

SystemConfig.getDefaultLeaveTypes = function () {
  return {
    casual: 12,
    sick: 8,
    earned: 20,
  };
};

SystemConfig.validateHolidays = function (holidays) {
  if (!Array.isArray(holidays)) {
    throw new Error("Holidays must be an array");
  }

  const currentYear = new Date().getFullYear();

  for (const holiday of holidays) {
    const date = new Date(holiday);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${holiday}`);
    }

    if (date.getFullYear() !== currentYear) {
      throw new Error(`Holiday date ${holiday} must be in the current year`);
    }
  }

  return true;
};

SystemConfig.validateLeaveTypes = function (leaveTypes) {
  if (typeof leaveTypes !== "object" || leaveTypes === null) {
    throw new Error("Leave types must be an object");
  }

  for (const [type, balance] of Object.entries(leaveTypes)) {
    if (typeof balance !== "number" || balance < 0) {
      throw new Error(`Invalid balance for leave type ${type}`);
    }
  }

  return true;
};

// Associations
SystemConfig.associate = (models) => {
  // No direct associations needed for system config
};

module.exports = SystemConfig;
