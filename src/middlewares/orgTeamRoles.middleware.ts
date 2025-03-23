import { NextFunction, Response, RequestHandler } from "express";
import { Types } from "mongoose";
import HttpException from "../exceptions/http.exception";
import teamModel from "../resources/organization/team/team.model";
import { OrgRole } from "../resources/organization/organization.protocol";
import { RequestWithUser } from "../types/express";

function verifyTeamRolesMiddleware(allowedRoles: string[]): RequestHandler {
  return async (req: RequestWithUser, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpException(401, "error", "Unauthorized");
      }

      const userId = new Types.ObjectId(String(req.user._id));

      const userOrganizations = req.user.organizations || [];

      // Extract teamId from request
      const { teamId } = req.params || req.body;
      if (!teamId) {
        throw new HttpException(400, "error", "Team ID is required.");
      }

      // **Allow Organization Admins to bypass team role checks**
      const isOrgAdmin = userOrganizations.some(
        (org) => org.role === OrgRole.Admin
      );

      if (isOrgAdmin) {
        return next();
      }

      // **Fetch the Team document**
      const team = await teamModel.findById(teamId);

      if (!team) {
        throw new HttpException(404, "error", "Team not found.");
      }

      // **Check if the user is a member of the team**
      const userTeamMember = team.members.find((member) =>
        member.memberId.equals(userId)
      );

      if (!userTeamMember) {
        throw new HttpException(403, "error", "User is not part of this team.");
      }

      // **Check if the user's role is allowed**
      if (!allowedRoles.includes(userTeamMember.role)) {
        throw new HttpException(
          403,
          "error",
          "Access Denied. Insufficient team permissions."
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default verifyTeamRolesMiddleware;
