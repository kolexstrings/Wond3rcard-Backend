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
      `${this.path}/all-users`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAllUsers
    );

    this.router.put(
      `${this.path}/enable-2fa-globally`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.assignGlobal2FA
    );

    this.router.get(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getUserById
    );

    this.router.patch(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.updateUser
    );

    this.router.delete(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteUser
    );

    this.router.post(
      `${this.path}/users/:id/ban`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.banUser
    );

    this.router.post(
      `${this.path}/users/:id/unban`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.unbanUser
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

  /**
   * Fetch details of a specific user
   */
  private getUserById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      const user = await this.adminService.getUserById(userId);
      res.status(200).json({
        status: "success",
        message: "User retrieved",
        payload: user,
      });
    } catch (error) {
      next(new HttpException(400, "Failed to fetch user", error.message));
    }
  };

  /**
   * Update user details (email, name, role)
   */
  private updateUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      const updatedUser = await this.adminService.updateUser(userId, req.body);
      res.status(200).json({
        status: "success",
        message: "User updated successfully",
        payload: updatedUser,
      });
    } catch (error) {
      next(new HttpException(400, "Failed to update user", error.message));
    }
  };

  /**
   * Permanently delete user
   */
  private deleteUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      const message = await this.adminService.deleteUser(userId);
      res.status(200).json({ status: "success", message });
    } catch (error) {
      next(new HttpException(400, "Failed to delete user", error.message));
    }
  };

  /**
   * Ban user by updating their status to "Banned"
   */
  private banUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const message = await this.adminService.banUser(userId);
      res.status(200).json({ status: "success", message });
    } catch (error) {
      next(new HttpException(400, "Failed to ban user", error.message));
    }
  };

  /**
   * Unban user by setting status back to "Active"
   */
  private unbanUser = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.params.id;
      const message = await this.adminService.unbanUser(userId);
      res.status(200).json({ status: "success", message });
    } catch (error) {
      next(new HttpException(400, "Failed to unban user", error.message));
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
