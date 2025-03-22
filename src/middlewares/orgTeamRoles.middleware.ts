import { NextFunction, Request, Response, RequestHandler } from "express";
import HttpException from "../exceptions/http.exception";
import { Types } from "mongoose";

function verifyTeamRolesMiddleware(allowedRoles: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpException(401, "error", "Unauthorized");
      }

      const userTeams = req.user.teams;
      const userOrgRole = req.user.organizationRole; // Assuming this is set in req.user

      // Extract teamId from request
      const { teamId } = req.params || req.body;
      if (!teamId) {
        throw new HttpException(400, "error", "Team ID is required.");
      }

      // **Allow Organization Admins to bypass team role checks**
      if (userOrgRole === "Admin") {
        return next();
      }

      // Find user's role in the team
      const userTeam = userTeams.find((team) =>
        new Types.ObjectId(team.teamId).equals(new Types.ObjectId(teamId))
      );

      if (!userTeam) {
        throw new HttpException(403, "error", "User is not part of this team.");
      }

      if (!allowedRoles.includes(userTeam.role)) {
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
