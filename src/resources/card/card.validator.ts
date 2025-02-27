import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { CardType } from "./card.protocol";

const objectIdValidation = (value: string, helpers: Joi.CustomHelpers) => {
  const regex = /^[0-9a-fA-F]{24}$/;
  if (!regex.test(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

const JoiExtended = Joi.extend((joi) => ({
  type: "objectId",
  base: joi.string(),
  messages: {
    "any.invalid": "{{#label}} must be a valid ObjectId",
  },
  rules: {
    objectId: {
      validate: objectIdValidation,
    },
  },
}));

const contactInfoSchema = Joi.object({
  email: Joi.string().email().allow("").default(""),
  phone: Joi.string().allow("").default(""),
  website: Joi.string().uri().allow("").default(""),
  address: Joi.string().allow("").default(""),
}).default();

const socialMediaLinksSchema = Joi.array().items(
  Joi.object({
    link: Joi.object({
      iconUrl: Joi.string().uri().required(),
      name: Joi.string().required(),
      type: Joi.string().required(),
      link: Joi.string().uri().required(),
    }).required(),
    handle: Joi.string().uri().required(),
    active: Joi.boolean().default(true),
    label: Joi.string().required(),
  })
);

const organizationInfoSchema = Joi.object({
  organizationId: JoiExtended.objectId().allow("").default(""),
  organizationName: Joi.string().allow("").default(""),
}).default();

const validateCreateCard = Joi.object({
  cardType: Joi.string().default(CardType.Personal),
  creatorId: JoiExtended.objectId().required(),
  ownerId: JoiExtended.objectId().required(),
  cardName: Joi.string().required(),
  suffix: Joi.string().allow("").default(""),
  firstName: Joi.string().required(),
  middleName: Joi.string().allow("").default(""),
  lastName: Joi.string().allow("").default(""),
  dateOfBirth: Joi.string().allow("").default(""),
  position: Joi.string().allow("").default(""),
  notes: Joi.string().allow("").default(""),
  videoUrl: Joi.string().allow("").default(""),
  profilePicture: Joi.string().allow("").default(""),
  cardBackground: Joi.string().allow("").default(""),
  active: Joi.boolean().default(false),
  contactInfo: contactInfoSchema,
});

const validateCreateTeamMemberCard = Joi.object({
  ...validateCreateCard.describe().keys,
  cardType: Joi.string().default("organizational"),
  organizationInfo: organizationInfoSchema.required(),
});

const updateCard = Joi.object({
  ...validateCreateCard.describe().keys,
  cardId: JoiExtended.objectId().required(),
});

const validateGetCard = Joi.object({
  cardId: JoiExtended.objectId().required(),
});

const deleteUserOrgCard = Joi.object({
  cardId: JoiExtended.objectId().required(),
  organizationId: JoiExtended.objectId().required(),
});

const validateShareCard = Joi.object({
  cardId: JoiExtended.objectId().required().messages({
    "any.required": "Card ID is required",
    "any.invalid": "Invalid Card ID",
  }),
  recipientId: JoiExtended.objectId().required().messages({
    "any.required": "Recipient ID is required",
    "any.invalid": "Invalid Recipient ID",
  }),
});

const validateGenerateQrShareLink = Joi.object({
  cardId: JoiExtended.objectId().required().messages({
    "any.required": "Card ID is required",
    "any.invalid": "Invalid Card ID",
  }),
});

const parseFormData = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.socialMediaLinks) {
    req.body.socialMediaLinks = Array.isArray(req.body.socialMediaLinks)
      ? req.body.socialMediaLinks.map((item: string) => JSON.parse(item))
      : [JSON.parse(req.body.socialMediaLinks)];
  }

  next();
};

export default {
  validateCreateCard,
  validateCreateTeamMemberCard,
  validateGetCard,
  updateCard,
  deleteUserOrgCard,
  validateShareCard,
  validateGenerateQrShareLink,
  parseFormData,
};
