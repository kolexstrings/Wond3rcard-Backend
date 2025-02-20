import Joi from "joi";

const createOrgValidator = Joi.object({
  name: Joi.string().required(),
})

const addMemberValidator = Joi.object({
  memberId: Joi.string().required(),
  organizationId: Joi.string().required(),
  role: Joi.string().valid('admin', 'member', 'viewer').required(),
});

const changeRoleValidator = Joi.object({
  memberId: Joi.string().required(),
  newRole: Joi.string().valid('none', 'teamMember', 'teamLead', 'teamModerator').required(),
});

const removeMemberValidator = Joi.object({
  memberId: Joi.string().required(),
});

const updateOrganizationValidator = Joi.object({
  name: Joi.string().optional(),
  members: Joi.array().items(
    Joi.object({
      memberId: Joi.string().required(),
      role: Joi.string().valid('none', 'teamMember', 'teamLead', 'teamModerator').required(),
    })
  ).optional(),
});


export default { createOrgValidator, addMemberValidator, removeMemberValidator, updateOrganizationValidator, changeRoleValidator }