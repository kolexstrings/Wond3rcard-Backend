import Joi from "joi";

export const validateManualPayment = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Amount must be a positive number",
    "any.required": "Amount is required",
  }),
  plan: Joi.string().required().messages({
    "any.required": "Plan is required",
  }),
  billingCycle: Joi.string().valid("monthly", "yearly").required().messages({
    "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
    "any.required": "Billing cycle is required",
  }),
  paymentMethod: Joi.string().required().messages({
    "any.required": "Payment method is required",
  }),
});
