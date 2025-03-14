import { Types } from "mongoose";

enum TeamRole {
  None = "none",
  Member = "member",
  Lead = "lead",
  Moderator = "moderator",
}

interface OrganizationMember {
  memberId: string;
  organizationId: string;
  role: TeamRole;
}

interface Organization {
  id: Types.ObjectId;
  creatorId: Types.ObjectId;
  name: string;
  businessType: string;
  industry: string;
  companyWebsite?: string;
  members?: OrganizationMember[];
}

export { Organization, OrganizationMember, TeamRole };
