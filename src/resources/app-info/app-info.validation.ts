import Joi from 'joi';

const appInfoValidationSchema = Joi.object({
  helpAndSupport: Joi.string().required(),
  adminEmail: Joi.string().email().required(),
  contactEmail: Joi.string().email().required(),
  address: Joi.string().required(),
  appLogo: Joi.string().uri().optional(),
  privacyPolicyURL: Joi.string().uri().required(),
  termsOfServiceURL: Joi.string().uri().required(),
  appVersion: Joi.string().required(),
  websiteURL: Joi.string().uri().required(),
  appStoreURL: Joi.string().uri().optional(),
  playStoreURL: Joi.string().uri().optional(),
  socialMediaLinks: Joi.object({
    facebook: Joi.string().uri().optional(),
    twitter: Joi.string().uri().optional(),
    instagram: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
  }).optional(),
  maintenanceMode: Joi.boolean().required(),
  maintenanceMessage: Joi.string().optional(),
});


export default { appInfoValidationSchema }