import Joi from "joi";

const validateCardTemplate = Joi.object({
  name: Joi.string().required(),
  design: Joi.string().required(), // Assuming SVG as a string
  price: Joi.number().min(0).required(),
  createdBy: Joi.string().required(), // User ID as a string
});

const validatePhysicalCardOrder = Joi.object({
  user: Joi.string().required(), // User ID
  cardTemplate: Joi.string().required(), // Template ID
  quantity: Joi.number().integer().min(1).required(),
  primaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  secondaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  finalDesign: Joi.string().required(), // Final SVG string
  status: Joi.string()
    .valid("pending", "processing", "shipped", "delivered")
    .required(),
});

export default {
  validateCardTemplate,
  validatePhysicalCardOrder,
};
