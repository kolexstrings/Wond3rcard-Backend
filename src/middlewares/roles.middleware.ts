import { NextFunction, Request, Response } from "express";
import { UserRole } from "../resources/user/user.protocol";
import HttpException from "../exceptions/http.exception";

function verifyRolesMiddleware(allowedRoles: UserRole[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    // Ensure user is authenticated
    if (!req.user) {
      return next(new HttpException(401, "error", "Unauthorized"));
    }

    // Check if user has the required role
    const hasPermission = allowedRoles.includes(req.user.userRole);
    if (!hasPermission) {
      return next(
        new HttpException(
          403,
          "error",
          "Access Denied. Contact Admin if you think this is a mistake."
        )
      );
    }

    next();
  };
}

export default verifyRolesMiddleware;
