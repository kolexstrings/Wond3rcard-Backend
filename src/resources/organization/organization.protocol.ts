import { Types } from "mongoose";

enum OrgRole {
  Admin = "admin",
  Lead = "lead",
  Moderator = "moderator",
  Member = "member",
}

interface OrganizationMember {
  memberId: Types.ObjectId;
  role: OrgRole;
}

interface Organization {
  _id: Types.ObjectId;
  creatorId: Types.ObjectId;
  name: string;
  businessType: string;
  industry: string;
  companyWebsite?: string;
  members?: OrganizationMember[];
  teams?: Types.ObjectId[];
}

export { Organization, OrganizationMember, OrgRole };
