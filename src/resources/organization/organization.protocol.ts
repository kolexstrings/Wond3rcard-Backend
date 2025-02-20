
enum TeamRole {
  None = "none",
  Member = "member",
  Lead = "lead",
  Moderator = "moderator"
}

interface OrganizationMember {
  memberId: string;
  organizationId: string;
  role: TeamRole;
}

interface Organization {
  id: string;
  creatorId: string;
  name: string;
  members?: OrganizationMember[];
}

export { Organization, OrganizationMember, TeamRole };
