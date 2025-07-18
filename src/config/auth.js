require("dotenv").config({ path: "./config.env" });

const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  algorithm: "HS256",
};

const PASSWORD_CONFIG = {
  saltRounds: 12,
  minLength: 6,
};

const ROLES = {
  EMPLOYEE: "employee",
  MANAGER: "manager",
  ADMIN: "admin",
};

const LEAVE_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

const LEAVE_TYPES = {
  CASUAL: "casual",
  SICK: "sick",
  EARNED: "earned",
};

const ACTION_TYPES = {
  LEAVE_APPLIED: "leave_applied",
  LEAVE_APPROVED: "leave_approved",
  LEAVE_REJECTED: "leave_rejected",
  LEAVE_CANCELLED: "leave_cancelled",
  USER_CREATED: "user_created",
  USER_UPDATED: "user_updated",
  USER_DELETED: "user_deleted",
  ROLE_CHANGED: "role_changed",
  MANAGER_ASSIGNED: "manager_assigned",
  BALANCE_RESET: "balance_reset",
  CONFIG_UPDATED: "config_updated",
  HOLIDAYS_SET: "holidays_set",
  WORKING_DAYS_SET: "working_days_set",
};

module.exports = {
  JWT_CONFIG,
  PASSWORD_CONFIG,
  ROLES,
  LEAVE_STATUS,
  LEAVE_TYPES,
  ACTION_TYPES,
};
