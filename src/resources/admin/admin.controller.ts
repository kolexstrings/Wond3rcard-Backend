import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import profileMiddleware from "../../middlewares/profile.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import GlobalController from "../../protocols/global.controller";
import { User, UserRole } from "../user/user.protocol";
import AdminService from "./admin.service";

class AdminController implements GlobalController {
  public path = "/admin";
  public router = Router();
  private adminService = new AdminService();

  constructor() {
    this.initializeRoute();
  }

  initializeRoute(): void {
    this.router.get(
      `${this.path}/profile`,
      profileMiddleware,
      this.staffProfile
    );

    this.router.put(
      `${this.path}/enable-2fa-globally`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.assignGlobal2FA
    );

    this.router.get(
      `${this.path}/all-users`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAllUsers
    );

    this.router.patch(
      `${this.path}/maintenance`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.toggleMaintenance
    );
  }

  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<User[] | void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    try {
      const { users, total } = await this.adminService.getAllUsers(page, limit);
      const totalPages = Math.ceil(total / limit);
      res.status(200).json({
        status: "success",
        message: "users retrieved",
        payload: [users, total, page, totalPages],
      });
    } catch (error) {
      console.log(`ERROR ${error}`);

      next(new HttpException(400, "failed", error.message));
    }
  };

  private toggleMaintenance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const { enabled } = req.body;
      const response = await this.adminService.toggleMaintenanceMode(enabled);
      return res.status(201).json({ message: response });
    } catch (error) {
      next(error);
    }
  };
  private assignGlobal2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const response = await this.adminService.enable2FAGlobally();
      return res.status(201).json({ message: "Global 2FA enabled", response });
    } catch (error) {
      next(new HttpException(500, "Internal Server Error", error.message));
    }
  };
}

export default AdminController;
