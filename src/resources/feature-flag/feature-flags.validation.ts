import Joi from "joi";

const validateCreateFeature = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().default('feature flag description'),
  enabled: Joi.boolean().default(false),
})


const validateUpdateFeature = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  enabled: Joi.boolean().required(),
})

const validateDeleteFeatureFlag = Joi.object({
  name: Joi.string().required()
})

const validateGetFeatureFlag = Joi.object({
  featureName: Joi.string().required()
})

export default { validateDeleteFeatureFlag, validateCreateFeature, validateUpdateFeature, validateGetFeatureFlag }