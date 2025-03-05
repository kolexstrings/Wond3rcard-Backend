import Joi from "joi";

export const validateStripePayment = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required",
    "string.base": "User ID must be a string",
  }),
  plan: Joi.string().required().messages({
    "any.required": "Subscription plan is required",
    "string.base": "Subscription plan must be a string",
  }),
  billingCycle: Joi.string().valid("monthly", "yearly").required().messages({
    "any.required": "Billing cycle is required",
    "string.base": "Billing cycle must be a string",
    "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
  }),
});
