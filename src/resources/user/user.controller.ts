import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import validationMiddleware from "../../middlewares/validation.middleware";
import GeneralController from "../../protocols/global.controller";
import { UserRole, UserStatus, UserType } from "./user.protocol";
import UserService from "./user.service";
import validate from "./user.validation";

class UserController implements GeneralController {
  public path = "/users";
  public router = Router();
  private userService = new UserService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/user-profile`,
      [authenticatedMiddleware],
      this.getProfile
    );
  }

  private getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      if (!req.user) {
        return next(new HttpException(401, "error", "No signed-in user"));
      }

      const profile = await this.userService.getProfile(req.user.id);

      return res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: {
          user: req.user,
          profile,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private changeUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { userId, role } = req.body;
      await this.userService.changeUserRole(userId, role as UserRole);
      return res
        .status(200)
        .json({ message: "User role updated successfully." });
    } catch (error) {
      next(new HttpException(500, "error", `${error}`));
    }
  };

  private changeUserType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { userId, type } = req.body;
      await this.userService.changeUserType(userId, type as UserType);
      return res
        .status(200)
        .json({ message: "User type updated successfully." });
    } catch (error) {
      next(new HttpException(500, "error", `${error}`));
    }
  };

  private changeUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { userId, status } = req.body;
      await this.userService.changeUserStatus(userId, status as UserStatus);
      return res
        .status(200)
        .json({ message: "User status updated successfully." });
    } catch (error) {
      next(new HttpException(500, "error", `${error}`));
    }
  };
}

export default UserController;
