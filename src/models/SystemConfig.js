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
      allowNull: true,
      validate: {
        isIn: [[4, 5, 6]],
      },
    },
    holidays: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      validate: {
        isObject: function (value) {
          return value === null || typeof value === "object";
        },
      },
    },
    leave_types: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
      validate: {
        isObject: function (value) {
          return value === null || typeof value === "object";
        },
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Users",
        key: "id",
      },
    },
  },
  {
    tableName: "system_config",
    timestamps: true,
  }
);

SystemConfig.prototype.isHoliday = function (date) {
  const dateStr = date.toISOString().split("T")[0];
  return this.holidays.hasOwnProperty(dateStr);
};

SystemConfig.prototype.isWeekend = function (date) {
  const day = date.getDay();
  const workingDays = this.working_days_per_week;

  if (workingDays === 5) {
    return day === 0 || day === 6;
  } else if (workingDays === 4) {
    return day === 0 || day === 6 || day === 5;
  } else if (workingDays === 6) {
    return day === 0;
  }

  return false;
};

SystemConfig.prototype.getWorkingDaysBetween = function (startDate, endDate) {
  let workingDays = 0;
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const currentDate = new Date(start);

  while (currentDate <= end) {
    if (!this.isHoliday(currentDate) && !this.isWeekend(currentDate)) {
      workingDays++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return workingDays;
};

SystemConfig.getCurrentYearConfig = function () {
  const currentYear = new Date().getFullYear();
  return this.findOne({
    where: { year: currentYear },
    include: [
      {
        model: require("./User"),
        as: "creator",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

SystemConfig.getConfigByYear = function (year) {
  return this.findOne({
    where: { year },
    include: [
      {
        model: require("./User"),
        as: "creator",
        attributes: ["id", "name", "email"],
      },
    ],
  });
};

SystemConfig.createYearlyConfig = async function (year, config, createdBy) {
  const existingConfig = await this.findOne({ where: { year } });

  if (existingConfig) {
    throw new Error(`Configuration for year ${year} already exists`);
  }

  return this.create({
    year,
    working_days_per_week: config.working_days_per_week,
    holidays: config.holidays || {},
    leave_types: config.leave_types || {},
    created_by: createdBy || null,
  });
};

SystemConfig.updateConfig = async function (year, updates) {
  const config = await this.findOne({ where: { year } });

  if (!config) {
    throw new Error(`Configuration for year ${year} not found`);
  }

  return config.update(updates);
};

SystemConfig.upsertConfig = async function (year, updates, createdBy) {
  const config = await this.findOne({ where: { year } });

  if (config) {
    const mergedUpdates = {
      working_days_per_week:
        updates.working_days_per_week !== undefined
          ? updates.working_days_per_week
          : config.working_days_per_week,
      holidays:
        updates.holidays !== undefined ? updates.holidays : config.holidays,
      leave_types:
        updates.leave_types !== undefined
          ? updates.leave_types
          : config.leave_types,
    };
    return config.update(mergedUpdates);
  } else {
    const newConfig = {
      year,
      created_by: createdBy || null,
      ...updates,
    };
    return this.create(newConfig);
  }
};

SystemConfig.getDefaultLeaveTypes = function () {
  return {
    casual: 12,
    sick: 8,
    earned: 20,
  };
};

SystemConfig.validateHolidays = function (holidays) {
  if (typeof holidays !== "object" || holidays === null) {
    throw new Error("Holidays must be an object");
  }

  for (const [date, title] of Object.entries(holidays)) {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error(`Invalid date format: ${date}`);
    }

    if (typeof title !== "string" || title.trim() === "") {
      throw new Error(`Invalid title for date ${date}`);
    }

    if (dateObj.getDay() === 0) {
      throw new Error(`Cannot set Sunday (${date}) as a holiday`);
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

SystemConfig.associate = (models) => {
  SystemConfig.belongsTo(models.User, {
    foreignKey: "created_by",
    as: "creator",
  });
};

module.exports = SystemConfig;
