import { NextFunction, Request, Response } from "express";
import { UserType } from "../resources/user/user.protocol";
function verifyRolesMiddleware(allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const userType = req.user?.userType || UserType.Customer;

    const hasPermission = allowedRoles.includes(userType);
    if (!hasPermission) {
      return res.status(403).json({ status: "Forbidden", message: `This above your pay grade. If you think this is a mistake, contact admin!` });
    }
    next();
  };
}

export default verifyRolesMiddleware