import Joi from "joi";

// Validation schema for creating an order
const validateCreateOrder = Joi.object({
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string.",
    "any.required": "User ID is required.",
  }),
  physicalCardId: Joi.string().required().messages({
    "string.base": "Physical card ID must be a string.",
    "any.required": "Physical card ID is required.",
  }),
  cardTemplateId: Joi.string().required().messages({
    "string.base": "Card template ID must be a string.",
    "any.required": "Card template ID is required.",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number.",
    "number.integer": "Quantity must be an integer.",
    "number.min": "Quantity must be at least 1.",
    "any.required": "Quantity is required.",
  }),
  region: Joi.string().valid("nigeria", "other").required().messages({
    "string.base": "Region must be a string.",
    "string.valid": "Region must be either 'nigeria' or 'other'.",
    "any.required": "Region is required.",
  }),
  address: Joi.string().required().messages({
    "string.base": "Address must be a string.",
    "any.required": "Address is required.",
  }),
});

const validateCreateManualOrder = Joi.object({
  userId: Joi.string().required().messages({
    "string.base": "User ID must be a string.",
    "any.required": "User ID is required.",
  }),
  physicalCardId: Joi.string().required().messages({
    "string.base": "Physical card ID must be a string.",
    "any.required": "Physical card ID is required.",
  }),
  cardTemplateId: Joi.string().required().messages({
    "string.base": "Card template ID must be a string.",
    "any.required": "Card template ID is required.",
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number.",
    "number.integer": "Quantity must be an integer.",
    "number.min": "Quantity must be at least 1.",
    "any.required": "Quantity is required.",
  }),
  region: Joi.string().valid("nigeria", "other").required().messages({
    "string.base": "Region must be a string.",
    "string.valid": "Region must be either 'nigeria' or 'other'.",
    "any.required": "Region is required.",
  }),
  address: Joi.string().required().messages({
    "string.base": "Address must be a string.",
    "any.required": "Address is required.",
  }),
});

export default {
  validateCreateOrder,
  validateCreateManualOrder,
};
