import Joi from "joi";

// MongoDB ObjectId validation regex
const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId format")
  .required();

const addConnectionValidator = Joi.object({
  userId: objectIdSchema,
  connectionId: objectIdSchema,
});

const removeConnectionValidator = Joi.object({
  userId: objectIdSchema,
  connectionId: objectIdSchema,
});

const getUserConnectionsValidator = Joi.object({
  userId: objectIdSchema,
});

export default {
  addConnectionValidator,
  removeConnectionValidator,
  getUserConnectionsValidator,
};
