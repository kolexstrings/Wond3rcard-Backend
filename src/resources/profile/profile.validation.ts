import Joi from "joi";

const addContact = Joi.object({
  contactEmail: Joi.string().email().required(),
});

const connectValidator = Joi.object({
  userId: Joi.string().required().messages({
    "string.empty": "User Id is required",
  }),
});

const idValidator = Joi.string().required();

const updateProfile = Joi.object({
  firstname: Joi.string().trim(),
  othername: Joi.string().trim().allow(""),
  lastname: Joi.string().trim(),
  mobileNumber: Joi.string().trim(),
  email: Joi.string().email(),
  companyName: Joi.string().trim().allow(""),
  designation: Joi.string().trim().allow(""),
  profileUrl: Joi.string().uri().allow(""),
  coverUrl: Joi.string().uri().allow(""),
});

export default { addContact, idValidator, connectValidator, updateProfile };
