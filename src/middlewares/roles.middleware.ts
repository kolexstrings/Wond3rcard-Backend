import { NextFunction, Request, RequestHandler, Response } from "express";
import { UserRole } from "../resources/user/user.protocol";
import HttpException from "../exceptions/http.exception";

function verifyRolesMiddleware(allowedRoles: UserRole[]): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated
      if (!req.user) {
        throw new HttpException(401, "error", "Unauthorized");
      }

      // Check if user has the required role
      if (!allowedRoles.includes(req.user.userRole)) {
        throw new HttpException(
          403,
          "error",
          "Access Denied. Contact Admin if you think this is a mistake."
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default verifyRolesMiddleware;
