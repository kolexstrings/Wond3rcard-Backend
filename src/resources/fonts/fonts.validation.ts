import Joi from "joi";

const upload = Joi.object({
  name: Joi.string().required(),
  style: Joi.string().allow(''),
})

const update = Joi.object({
  id: Joi.string().required(),
  name: Joi.string().required(),
  style: Joi.string().allow(''),
})

const deleteFont = Joi.object({
  id: Joi.string().required(),
})

const getFont = Joi.object({
  name: Joi.string().required(),
  style: Joi.string().allow(''),
})

export default { upload, update, deleteFont, getFont }