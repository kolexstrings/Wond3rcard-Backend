import { TeamRole } from "../resources/organization/organization.protocol";
import { User } from "../resources/user/user.protocol";

function hasTeamRole(user: User, organizationId: string, role: TeamRole): boolean {
  return user.organizations.some(
    (orgRole) => orgRole.organizationId === organizationId && orgRole.role === role
  );
}
