import Joi from "joi";
import { TeamRole } from "./team.protocol";

// MongoDB ObjectId validation regex
const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId format")
  .required();

const createTeamValidator = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  leadId: objectIdSchema.required(),
});

const addTeamMemberValidator = Joi.object({
  memberId: objectIdSchema,
  role: Joi.string()
    .valid(...Object.values(TeamRole))
    .required(),
});

const removeTeamMemberValidator = Joi.object({
  memberId: objectIdSchema,
});

const updateTeamValidator = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  members: Joi.array()
    .items(
      Joi.object({
        memberId: objectIdSchema,
        role: Joi.string()
          .valid(...Object.values(TeamRole))
          .required(),
      })
    )
    .optional(),
}).min(1);

const assignRoleValidator = Joi.object({
  memberId: objectIdSchema,
  role: Joi.string()
    .valid(...Object.values(TeamRole))
    .required(),
});

const getTeamMembersValidator = Joi.object({
  teamId: objectIdSchema,
});

export default {
  createTeamValidator,
  addTeamMemberValidator,
  removeTeamMemberValidator,
  updateTeamValidator,
  assignRoleValidator,
  getTeamMembersValidator,
};
