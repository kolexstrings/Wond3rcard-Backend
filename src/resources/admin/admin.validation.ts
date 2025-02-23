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

export const validateEnableGlobal2FA = Joi.object({
  enable: Joi.boolean().required(),
});

export const validateToggleMaintenance = Joi.object({
  enable: Joi.boolean().required(),
});
