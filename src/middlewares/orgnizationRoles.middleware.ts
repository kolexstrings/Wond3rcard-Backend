import { NextFunction, Request, RequestHandler, Response } from "express";
import HttpException from "../exceptions/http.exception";
import { Types } from "mongoose";
import organizationModel from "../resources/organization/organization.model";

function verifyOrgRolesMiddleware(allowedRoles: string[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new HttpException(401, "error", "Unauthorized");
      }

      const orgId = req.params.orgId || req.body.orgId;
      if (!orgId || !Types.ObjectId.isValid(orgId)) {
        throw new HttpException(400, "error", "Invalid organization ID.");
      }

      const requesterId = req.user.id || req.user._id;

      // Fetch the organization details
      const organization = await organizationModel.findById(orgId);
      if (!organization) {
        throw new HttpException(404, "error", "Organization not found.");
      }

      // Find the requester's role in this organization
      const requester = organization.members.find(
        (member) => member.memberId.toString() === requesterId.toString()
      );

      if (!requester) {
        throw new HttpException(
          403,
          "error",
          "User is not part of this organization."
        );
      }

      // Ensure the requester has the required role
      if (!allowedRoles.includes(requester.role)) {
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
