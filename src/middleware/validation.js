const Joi = require("joi");

const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

const validateUserCreation = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).required().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 255 characters",
      "any.required": "Name is required",
    }),
    email: Joi.string().email().required().messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    password: Joi.string().min(6).required().messages({
      "string.min": "Password must be at least 6 characters long",
      "any.required": "Password is required",
    }),
    role: Joi.string()
      .valid("employee", "manager", "admin")
      .default("employee")
      .messages({
        "any.only": "Role must be employee, manager, or admin",
      }),
    manager_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .optional()
      .messages({
        "number.base": "Manager ID must be a number",
        "number.integer": "Manager ID must be an integer",
        "number.positive": "Manager ID must be positive",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

const validateUserUpdate = (req, res, next) => {
  const schema = Joi.object({
    name: Joi.string().min(2).max(255).optional().messages({
      "string.min": "Name must be at least 2 characters long",
      "string.max": "Name cannot exceed 255 characters",
    }),
    email: Joi.string().email().optional().messages({
      "string.email": "Please provide a valid email address",
    }),
    role: Joi.string().valid("employee", "manager").optional().messages({
      "any.only": "Role must be employee or manager",
    }),
    manager_id: Joi.number()
      .integer()
      .positive()
      .allow(null)
      .optional()
      .messages({
        "number.base": "Manager ID must be a number",
        "number.integer": "Manager ID must be an integer",
        "number.positive": "Manager ID must be positive",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

const validateLeaveApplication = (req, res, next) => {
  const schema = Joi.object({
    from_date: Joi.date().iso().required().messages({
      "date.base": "From date must be a valid date",
      "any.required": "From date is required",
    }),
    to_date: Joi.date().iso().min(Joi.ref("from_date")).required().messages({
      "date.base": "To date must be a valid date",
      "date.min": "To date cannot be before from date",
      "any.required": "To date is required",
    }),
    type: Joi.string().valid("casual", "sick", "earned").required().messages({
      "any.only": "Leave type must be casual, sick, or earned",
      "any.required": "Leave type is required",
    }),
    reason: Joi.string().min(1).max(1000).required().messages({
      "string.min": "Reason cannot be empty",
      "string.max": "Reason cannot exceed 1000 characters",
      "any.required": "Reason is required",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

const validateLeaveApproval = (req, res, next) => {
  const schema = Joi.object({
    status: Joi.string().valid("approved", "rejected").required().messages({
      "any.only": "Status must be approved or rejected",
      "any.required": "Status is required",
    }),
    manager_comment: Joi.string().max(500).optional().messages({
      "string.max": "Manager comment cannot exceed 500 characters",
    }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

const validateSystemConfig = (req, res, next) => {
  const schema = Joi.object({
    year: Joi.number().integer().min(2020).max(2030).required().messages({
      "number.base": "Year must be a number",
      "number.integer": "Year must be an integer",
      "number.min": "Year must be at least 2020",
      "number.max": "Year cannot exceed 2030",
      "any.required": "Year is required",
    }),
    working_days_per_week: Joi.number()
      .integer()
      .valid(4, 5, 6)
      .required()
      .messages({
        "number.base": "Working days per week must be a number",
        "number.integer": "Working days per week must be an integer",
        "any.only": "Working days per week must be 4, 5, or 6",
        "any.required": "Working days per week is required",
      }),
    holidays: Joi.array().items(Joi.string().isoDate()).required().messages({
      "array.base": "Holidays must be an array",
      "any.required": "Holidays are required",
    }),
    leave_types: Joi.object()
      .pattern(Joi.string(), Joi.number().integer().min(0))
      .required()
      .messages({
        "object.base": "Leave types must be an object",
        "any.required": "Leave types are required",
      }),
  });

  const { error } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: error.details.map((detail) => detail.message),
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateUserCreation,
  validateUserUpdate,
  validateLeaveApplication,
  validateLeaveApproval,
  validateSystemConfig,
};
