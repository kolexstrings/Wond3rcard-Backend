import Joi from "joi";
import { UserTiers } from "../../user/user.protocol";

const planEnum = Object.values(UserTiers);
const billingCycleEnum = ["monthly", "yearly"] as const;

export const validateManualPayment = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required",
  }),
  amount: Joi.number().positive().required().messages({
    "number.positive": "Amount must be a positive number",
    "any.required": "Amount is required",
  }),
  plan: Joi.string()
    .valid(...planEnum)
    .required()
    .messages({
      "any.required": "Plan is required",
      "any.only": "Plan must be basic, premium, or business",
    }),
  billingCycle: Joi.string()
    .valid(...billingCycleEnum)
    .required()
    .messages({
      "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
      "any.required": "Billing cycle is required",
    }),
  paymentMethod: Joi.string().required().messages({
    "any.required": "Payment method is required",
  }),
  durationInDays: Joi.number().positive().optional().messages({
    "number.positive": "Duration must be a positive number",
  }),
});

export const validateManualCancelSubscription = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required to cancel a manual subscription",
  }),
});

export const validateManualChangeSubscription = Joi.object({
  userId: Joi.string().required().messages({
    "any.required": "User ID is required to change a manual subscription",
  }),
  newPlan: Joi.string()
    .valid(...planEnum)
    .required()
    .messages({
      "any.required": "New plan is required",
      "any.only": "Plan must be basic, premium, or business",
    }),
  billingCycle: Joi.string()
    .valid(...billingCycleEnum)
    .required()
    .messages({
      "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
      "any.required": "Billing cycle is required",
    }),
  durationInDays: Joi.number().positive().optional().messages({
    "number.positive": "Duration must be a positive number",
  }),
  paymentMethod: Joi.string().optional(),
  amount: Joi.number().positive().optional().messages({
    "number.positive": "Amount must be a positive number",
  }),
});
