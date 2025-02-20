import Joi from 'joi';

const interactionTypeEnum = Joi.string().valid('view', 'share', 'save', 'phone', 'email', 'contact', 'qr-code', 'social-link');

const geolocationSchema = Joi.object({
  ip: Joi.string().allow(''),
  network: Joi.string().allow(''),
  version: Joi.string().default('IPv4'),
  city: Joi.string().allow(''),
  region: Joi.string().allow(''),
  region_code: Joi.string().allow(''),
  country: Joi.string().allow(''),
  country_name: Joi.string().allow(''),
  country_code: Joi.string().allow(''),
  country_code_iso3: Joi.string().allow(''),
  country_capital: Joi.string().allow(''),
  country_tld: Joi.string().allow(''),
  continent_code: Joi.string().allow(''),
  in_eu: Joi.boolean().default(false),
  postal: Joi.string().allow(''),
  latitude: Joi.number().default(0),
  longitude: Joi.number().default(0),
  timezone: Joi.string().allow(''),
  utc_offset: Joi.string().allow(''),
  country_calling_code: Joi.string().allow(''),
  currency: Joi.string().allow(''),
  currency_name: Joi.string().allow(''),
  languages: Joi.string().allow(''),
  country_area: Joi.number().default(0),
  country_population: Joi.number().default(0),
  asn: Joi.string().allow(''),
  org: Joi.string().allow(''),
});

const deviceInfoSchema = Joi.object({
  agent: Joi.string().required(),
  os: Joi.string().required(),
  device: Joi.string().required(),
});

const interactor = Joi.object({
  isWonderCardUser: Joi.boolean().default(false),
  uid: Joi.string().allow(''),
  fullName: Joi.string().allow(''),
});

const interact = Joi.object({
  cardId: Joi.string().required(),
  cardOwnerId: Joi.string().required(),
  interactionType: interactionTypeEnum.required(),
  ipAddress: Joi.string().required(),
  geolocation: geolocationSchema.allow(null),
  deviceInfo: deviceInfoSchema.required(),
  interactor: interactor.required(),
  createdAt: Joi.date().default(() => new Date()),
  updatedAt: Joi.date().default(() => new Date()),
});
const validateTimePeriod = Joi.object({
  timePeriod: Joi.string().valid('today', 'lastWeek', 'lastMonth').required(),
});

const validateGetUserSingleCard = Joi.object({
  cardId: Joi.string().required(),
});

const validateGetUserSingleCardWithTimePeriod = Joi.object({
  cardId: Joi.string().required(),
  timePeriod: Joi.string().valid('today', 'lastWeek', 'lastMonth').required(),
});

export default { interact, validateTimePeriod, validateGetUserSingleCard, validateGetUserSingleCardWithTimePeriod };
