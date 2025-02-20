import Joi from 'joi';

const faqValidationSchema = Joi.object({
  question: Joi.string().required(),
  answer: Joi.string().required(),
  category: Joi.string()
    .valid('General', 'Technical', 'Billing', 'Account')
    .optional(),
});

export default { faqValidationSchema };
