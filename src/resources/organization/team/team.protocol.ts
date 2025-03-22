import { Types } from "mongoose";

enum TeamRole {
  Lead = "lead",
  Moderator = "moderator",
  Member = "member",
}

interface TeamMember {
  memberId: Types.ObjectId;
  role: TeamRole;
}

interface Team {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  description?: string;
  members?: TeamMember[];
}

export { Team, TeamMember, TeamRole };
