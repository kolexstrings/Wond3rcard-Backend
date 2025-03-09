import Joi from "joi";

export const validateUpdateUser = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  otherName: Joi.string().allow("").optional(),
  email: Joi.string().email().optional(),
  mobileNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Phone number must be in international format, e.g., +1234567890",
    }),
  userRole: Joi.string().valid("admin", "staff", "customer").optional(),
  userStatus: Joi.string().valid("active", "banned", "suspended").optional(),
  userTiers: Joi.string().valid("basic", "premium", "business").optional(),
  companyName: Joi.string().allow(""),
  designation: Joi.string().allow(""),
});

export const validateSubscriptionTier = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.empty": "Subscription Tier name is required",
    "string.min": "Tier name must be at least 3 characters",
    "string.max": "Tier name must not exceed 50 characters",
  }),
  billingCycle: Joi.object({
    monthly: Joi.object({
      price: Joi.number().positive().required().messages({
        "any.required": "Monthly price is required",
        "number.base": "Monthly price must be a number",
        "number.positive": "Monthly price must be a positive number",
      }),
      durationInDays: Joi.number().positive().default(30).messages({
        "number.base": "Duration must be a number",
        "number.positive": "Duration must be a positive number",
      }),
    }).required(),
    yearly: Joi.object({
      price: Joi.number().positive().required().messages({
        "any.required": "Yearly price is required",
        "number.base": "Yearly price must be a number",
        "number.positive": "Yearly price must be a positive number",
      }),
      durationInDays: Joi.number().positive().default(365).messages({
        "number.base": "Duration must be a number",
        "number.positive": "Duration must be a positive number",
      }),
    }).required(),
  })
    .required()
    .messages({
      "object.base":
        "Billing cycle must be provided and follow the correct structure",
    }),
  description: Joi.string().max(500).required().messages({
    "string.empty": "Description is required",
    "string.max": "Description must not exceed 500 characters",
  }),
  trialPeriod: Joi.number().integer().positive().required().messages({
    "number.base": "Trial period must be a number",
    "number.positive": "Trial period must be a positive number",
  }),
  autoRenew: Joi.boolean().required().messages({
    "boolean.base": "Auto-renew must be a boolean",
  }),
  features: Joi.array().items(Joi.string()).required().messages({
    "array.base": "Features must be an array of strings",
  }),
});

export const validateSubscriptionTierUpdate = Joi.object({
  name: Joi.string().min(3).max(50).messages({
    "string.min": "Tier name must be at least 3 characters",
    "string.max": "Tier name must not exceed 50 characters",
  }),
  billingCycle: Joi.object({
    monthly: Joi.object({
      price: Joi.number().positive().messages({
        "number.base": "Monthly price must be a number",
        "number.positive": "Monthly price must be a positive number",
      }),
      durationInDays: Joi.number().integer().positive().messages({
        "number.base": "Monthly duration must be a number",
        "number.positive": "Monthly duration must be a positive number",
      }),
    }),
    yearly: Joi.object({
      price: Joi.number().positive().messages({
        "number.base": "Yearly price must be a number",
        "number.positive": "Yearly price must be a positive number",
      }),
      durationInDays: Joi.number().integer().positive().messages({
        "number.base": "Yearly duration must be a number",
        "number.positive": "Yearly duration must be a positive number",
      }),
    }),
  }),
  description: Joi.string().max(500).messages({
    "string.max": "Description must not exceed 500 characters",
  }),
  trialPeriod: Joi.number().integer().positive().messages({
    "number.base": "Trial period must be a number",
    "number.positive": "Trial period must be a positive number",
  }),
  autoRenew: Joi.boolean().messages({
    "boolean.base": "Auto-renew must be a boolean",
  }),
  features: Joi.array().items(Joi.string()).messages({
    "array.base": "Features must be an array",
  }),
});

export const validateDeleteSubscriptionTier = Joi.object({
  newTierId: Joi.string().required().messages({
    "string.empty": "New subscription tier ID is required",
    "string.base": "New subscription tier ID must be a string",
  }),
});

export const validateEnableGlobal2FA = Joi.object({
  enable: Joi.boolean().required(),
});

export const validateToggleMaintenance = Joi.object({
  enable: Joi.boolean().required(),
});

export const validateChangeUserRole = Joi.object({
  userRole: Joi.string().valid("admin", "staff", "customer").required(),
});

export const validateChangeUserTier = Joi.object({
  userTiers: Joi.string().valid("basic", "premium", "business").required(),
});

export const validateChangeUserStatus = Joi.object({
  userStatus: Joi.string().valid("active", "banned", "suspended").required(),
});
