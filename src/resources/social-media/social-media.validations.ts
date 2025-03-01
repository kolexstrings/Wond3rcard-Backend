import Joi from "joi";
import { MediaType } from "./social-media.protocol";

const createSocialMediaValidator = Joi.object({
  name: Joi.string()
    .trim()
    .required()
    .messages({ "string.empty": "Name is required" }),

  link: Joi.string().uri().required().messages({
    "string.uri": "Link must be a valid URL",
    "string.empty": "Link is required",
    "any.required": "Link is required",
  }),
  mediaType: Joi.string()
    .valid(...Object.values(MediaType))
    .required()
    .messages({
      "any.only": `MediaType must be one of: ${Object.values(MediaType).join(
        ", "
      )}`,
      "any.required": "MediaType is required",
    }),
});

export default { createSocialMediaValidator };
