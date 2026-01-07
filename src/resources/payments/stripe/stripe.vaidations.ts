import Joi from "joi";

const planEnum = ["basic", "premium", "business"] as const;
const billingCycleEnum = ["monthly", "yearly"] as const;

export const validateStripePayment = Joi.object({
  userId: Joi.string().optional().messages({
    "string.base": "User ID must be a string",
  }),
  plan: Joi.string()
    .valid(...planEnum)
    .required()
    .messages({
      "any.required": "Subscription plan is required",
      "string.base": "Subscription plan must be a string",
      "any.only": "Plan must be basic, premium, or business",
    }),
  billingCycle: Joi.string()
    .valid(...billingCycleEnum)
    .required()
    .messages({
      "any.required": "Billing cycle is required",
      "string.base": "Billing cycle must be a string",
      "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
    }),
});

export const validateStripeCancelSubscription = Joi.object({
  userId: Joi.string().optional().messages({
    "string.base": "User ID must be a string",
  }),
  subscriptionId: Joi.string().optional().allow("", null).messages({
    "string.base": "Subscription ID must be a string",
  }),
});

export const validateStripeChangeSubscription = Joi.object({
  userId: Joi.string().optional().messages({
    "string.base": "User ID must be a string",
  }),
  newPlan: Joi.string()
    .valid(...planEnum)
    .required()
    .messages({
      "any.required": "New subscription plan is required",
      "string.base": "New plan must be a string",
      "any.only": "Plan must be basic, premium, or business",
    }),
  billingCycle: Joi.string()
    .valid(...billingCycleEnum)
    .required()
    .messages({
      "any.required": "Billing cycle is required",
      "string.base": "Billing cycle must be a string",
      "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
    }),
});
