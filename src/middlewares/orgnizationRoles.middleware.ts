import { NextFunction, Request, RequestHandler, Response } from "express";
import HttpException from "../exceptions/http.exception";

function verifyOrgRolesMiddleware(allowedRoles: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpException(401, "error", "Unauthorized");
      }

      const userOrganizations = req.user.organizations;

      // Extract the user's role in the requested organization
      const { orgId } = req.params || req.body;
      const userOrg = userOrganizations.find((org) => org.orgId === orgId);

      if (!userOrg) {
        throw new HttpException(
          403,
          "error",
          "User is not part of this organization."
        );
      }

      if (!allowedRoles.includes(userOrg.role)) {
        throw new HttpException(
          403,
          "error",
          "Access Denied. Insufficient organization permissions."
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default verifyOrgRolesMiddleware;
