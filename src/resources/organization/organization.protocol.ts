import { Types } from "mongoose";

enum TeamRole {
  Admin = "admin",
  Lead = "lead",
  Moderator = "moderator",
  Member = "member",
}

interface OrganizationMember {
  memberId: Types.ObjectId;
  organizationId: Types.ObjectId;
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
  teams: Types.ObjectId[];
}

export { Organization, OrganizationMember, TeamRole };
