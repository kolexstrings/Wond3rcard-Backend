import Joi from "joi";

// Validation for creating a card template
const validateCardTemplate = Joi.object({
  name: Joi.string().required(),
  priceNaira: Joi.string().required(),
  priceUsd: Joi.string().required(),
});

// Validation for creating a physical card
const validatePhysicalCard = Joi.object({
  userId: Joi.string().required(),
  cardId: Joi.string().required(),
  templateId: Joi.string().required(),
  primaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  secondaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  finalDesign: Joi.string().required(),
});

const validateCustomPhysicalCard = Joi.object({
  userId: Joi.string().required(),
  cardId: Joi.string().required(),
  templateId: Joi.string().required(),
  primaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  secondaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .required(),
  photo: Joi.string().required(),
});

const validateGetPhysicalCardById = Joi.object({
  cardId: Joi.string().required(),
});

const validateTemplateId = Joi.object({
  templateId: Joi.string().required(),
});

const validatePhysicalCardUpdate = Joi.object({
  primaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .optional(),
  secondaryColor: Joi.string()
    .pattern(/^#([0-9A-Fa-f]{6})$/)
    .optional(),
  finalDesign: Joi.string().optional(),
});

export default {
  validateCardTemplate,
  validatePhysicalCard,
  validateCustomPhysicalCard,
  validateGetPhysicalCardById,
  validateTemplateId,
  validatePhysicalCardUpdate,
};
