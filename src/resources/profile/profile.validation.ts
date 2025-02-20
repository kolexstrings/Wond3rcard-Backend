import Joi from "joi";

const addContact = Joi.object({
  contactEmail: Joi.string().email().required(),
})

const connectValidator = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User Id is required",
  }),
})

const idValidator = Joi.string().required();


export default { addContact, idValidator, connectValidator }