import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../exceptions/http.exception";
import authenticatedMiddleware from "../../middlewares/authenticated.middleware";
import verifyRolesMiddleware from "../../middlewares/roles.middleware";
import {
  validateUpdateUser,
  validateEnableGlobal2FA,
  validateToggleMaintenance,
  validateChangeUserRole,
  validateChangeUserStatus,
  validateChangeUserTier,
  validateSubscriptionTier,
} from "./admin.validation";
import GlobalController from "../../protocols/global.controller";
import { User, UserRole } from "../user/user.protocol";
import { CreateSubscriptionTier } from "./subscriptionTier/admin.protocol";
import AdminService from "./admin.service";
import validationMiddleware from "../../middlewares/validation.middleware";

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

    this.router.get(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getUserById
    );

    this.router.patch(
      `${this.path}/users/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateUpdateUser),
      ],
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

    this.router.get(
      `${this.path}/roles`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getRoles
    );

    this.router.get(
      `${this.path}/statuses`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getStatuses
    );

    this.router.get(
      `${this.path}/subscription-tiers`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getSubscriptionTiers
    );

    this.router.patch(
      `${this.path}/users/:id/role`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserRole),
      ],
      this.changeUserRole
    );

    this.router.patch(
      `${this.path}/users/:id/tier`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserTier),
      ],
      this.changeUserTier
    );

    this.router.patch(
      `${this.path}/users/:id/status`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserStatus),
      ],
      this.changeUserStatus
    );

    this.router.get(
      `${this.path}/get-all-cards`,
      [authenticatedMiddleware],
      verifyRolesMiddleware([UserRole.Admin]),
      this.getAllCards
    );

    this.router.post(
      `${this.path}/subscription-tiers`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateSubscriptionTier),
      ],
      this.createSubscriptionTier
    );

    this.router.put(
      `${this.path}/enable-2fa-globally`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateEnableGlobal2FA),
      ],
      this.assignGlobal2FA
    );

    this.router.patch(
      `${this.path}/maintenance`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateToggleMaintenance),
      ],
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

  /**
   * get all roles available
   */
  private getRoles = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const roles = await this.adminService.getRoles();
      res.status(200).json({
        status: "success",
        message: "Roles retrieved successfully",
        payload: roles,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(new HttpException(400, "Failed to retrieve roles", error.message));
    }
  };

  /**
   * get all statuses available
   */
  private getStatuses = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const statuses = await this.adminService.getStatuses();
      res.status(200).json({
        status: "success",
        message: "Statuses retrieved successfully",
        payload: statuses,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(
        new HttpException(400, "Failed to retrieve statuses", error.message)
      );
    }
  };

  /**
   * get all subscription tiers available
   */
  private getSubscriptionTiers = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tiers = await this.adminService.getSubscriptionTiers();
      res.status(200).json({
        status: "success",
        message: "Subscription tiers retrieved successfully",
        payload: tiers,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(
        new HttpException(
          400,
          "Failed to retrieve subscription tiers",
          error.message
        )
      );
    }
  };

  /**
   * change role of a specific user
   */
  private changeUserRole = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params;
    const { userRole } = req.body;

    try {
      const updatedUser = await this.adminService.changeUserRole(id, userRole);
      res.status(200).json({
        status: "success",
        message: "User role updated successfully",
        payload: updatedUser,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(new HttpException(400, "Failed to update user role", error.message));
    }
  };

  /**
   * change role of a specific user
   */
  private changeUserStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params;
    const { userStatus } = req.body;

    try {
      const updatedUser = await this.adminService.changeUserStatus(
        id,
        userStatus
      );
      res.status(200).json({
        status: "success",
        message: "User status updated successfully",
        payload: updatedUser,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(
        new HttpException(400, "Failed to update user status", error.message)
      );
    }
  };

  /**
   * change subscription tier of a specific user
   */
  private changeUserTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { id } = req.params;
    const { userTier } = req.body;

    try {
      const updatedUser = await this.adminService.changeUserTier(id, userTier);
      res.status(200).json({
        status: "success",
        message: "User tier updated successfully",
        payload: updatedUser,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(new HttpException(400, "Failed to update user tier", error.message));
    }
  };

  private getAllCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const cards = await this.adminService.getAllCards();
      return res.json(cards);
    } catch (error) {
      next(error);
    }
  };

  private createSubscriptionTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      const tierData: CreateSubscriptionTier = req.body;

      const newTier = await this.adminService.createSubscriptionTier(tierData);

      return res.status(201).json({
        statusCode: 201,
        status: "success",
        message: "Subscription tier created successfully",
        payload: newTier,
      });
    } catch (error) {
      next(error);
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
