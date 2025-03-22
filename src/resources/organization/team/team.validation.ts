import Joi from "joi";

// MongoDB ObjectId validation regex
const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId format")
  .required();

const createTeamValidator = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  leadId: objectIdSchema,
});

const addTeamMemberValidator = Joi.object({
  teamId: objectIdSchema,
  memberId: objectIdSchema,
  role: Joi.string()
    .valid("teamMember", "teamLead", "teamModerator")
    .required(),
});

const removeTeamMemberValidator = Joi.object({
  teamId: objectIdSchema,
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
          .valid("teamMember", "teamLead", "teamModerator")
          .required(),
      })
    )
    .optional(),
}).min(1);

const getTeamMembersValidator = Joi.object({
  teamId: objectIdSchema,
});

export default {
  createTeamValidator,
  addTeamMemberValidator,
  removeTeamMemberValidator,
  updateTeamValidator,
  getTeamMembersValidator,
};
