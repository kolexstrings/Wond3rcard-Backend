import Joi from "joi";

// MongoDB ObjectId validation regex
const objectIdSchema = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ObjectId format")
  .required();

const createOrgValidator = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  businessType: Joi.string()
    .valid("LLC", "Corporation", "Nonprofit", "Startup")
    .required(),
  industry: Joi.string().min(3).max(100).required(),
  companyWebsite: Joi.string().uri().optional(),
  creatorId: objectIdSchema,
  members: Joi.array()
    .items(
      Joi.object({
        memberId: objectIdSchema,
        role: Joi.string()
          .valid("none", "teamMember", "teamLead", "teamModerator")
          .required(),
      })
    )
    .optional(),
});

const updateOrganizationValidator = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  businessType: Joi.string()
    .valid("LLC", "Corporation", "Nonprofit", "Startup")
    .optional(),
  industry: Joi.string().min(3).max(100).optional(),
  companyWebsite: Joi.string().uri().optional(),
  members: Joi.array()
    .items(
      Joi.object({
        memberId: objectIdSchema,
        role: Joi.string()
          .valid("none", "teamMember", "teamLead", "teamModerator")
          .required(),
      })
    )
    .optional(),
}).min(1);

const addMemberValidator = Joi.object({
  memberId: objectIdSchema,
  organizationId: objectIdSchema,
  role: Joi.string().valid("admin", "member", "viewer").required(),
});

const changeRoleValidator = Joi.object({
  memberId: objectIdSchema,
  newRole: Joi.string()
    .valid("none", "teamMember", "teamLead", "teamModerator")
    .required(),
});

const removeMemberValidator = Joi.object({
  memberId: objectIdSchema,
});

export default {
  createOrgValidator,
  addMemberValidator,
  removeMemberValidator,
  updateOrganizationValidator,
  changeRoleValidator,
};
