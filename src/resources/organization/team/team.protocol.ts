import { Types } from "mongoose";

enum TeamRole {
  None = "none",
  Member = "member",
  Lead = "lead",
  Moderator = "moderator",
}

interface TeamMember {
  memberId: Types.ObjectId;
  teamId: Types.ObjectId;
  role: TeamRole;
}

interface Team {
  id: Types.ObjectId;
  organizationId: Types.ObjectId;
  name: string;
  description?: string;
  members?: TeamMember[];
}

export { Team, TeamMember, TeamRole };
