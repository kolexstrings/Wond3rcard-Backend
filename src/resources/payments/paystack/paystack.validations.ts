import Joi from "joi";

export const validatePaystackPayment = Joi.object({
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

export const validateWebhookPayload = Joi.object({
  event: Joi.string().required().messages({
    "any.required": "Event type is required",
    "string.base": "Event must be a string",
  }),
  data: Joi.object({
    id: Joi.number().required().messages({
      "any.required": "Transaction ID is required",
      "number.base": "Transaction ID must be a number",
    }),
    metadata: Joi.object({
      userId: Joi.string().required().messages({
        "any.required": "User ID is required",
        "string.base": "User ID must be a string",
      }),
      plan: Joi.string().required().messages({
        "any.required": "Subscription plan is required",
        "string.base": "Subscription plan must be a string",
      }),
      billingCycle: Joi.string()
        .valid("monthly", "yearly")
        .required()
        .messages({
          "any.required": "Billing cycle is required",
          "string.base": "Billing cycle must be a string",
          "any.only": "Billing cycle must be either 'monthly' or 'yearly'",
        }),
      durationInDays: Joi.number().required().messages({
        "any.required": "Duration in days is required",
        "number.base": "Duration must be a number",
      }),
    }).required(),
  }).required(),
});
