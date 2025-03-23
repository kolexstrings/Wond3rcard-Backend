import { OrgRole } from "../resources/organization/organization.protocol";
import { User } from "../resources/user/user.protocol";
import { Types } from "mongoose";

function hasTeamRole(
  user: User,
  organizationId: string,
  role: OrgRole
): boolean {
  return user.organizations.some(
    (orgRole) =>
      new Types.ObjectId(orgRole.memberId).equals(
        new Types.ObjectId(organizationId)
      ) && orgRole.role === role
  );
}
