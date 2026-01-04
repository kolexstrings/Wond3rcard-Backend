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
  validateSubscriptionTierUpdate,
  validateDeleteSubscriptionTier,
} from "./admin.validation";
import GlobalController from "../../protocols/global.controller";
import { User, UserRole } from "../user/user.protocol";
import { CreateSubscriptionTier } from "./admin.protocol";
import AdminService from "./admin.service";
import validationMiddleware from "../../middlewares/validation.middleware";

class AdminController implements GlobalController {
  public path = "/admin";
  public router = Router();
  private adminService = new AdminService();

  constructor() {
    this.initializeRoute();
  }

  /**
   * Users
   */
  initializeRoute(): void {
    /**
     * @openapi
     * /api/admin/all-users:
     *   get:
     *     tags: [admin]
     *     summary: Retrieve paginated list of users
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           default: 1
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           default: 10
     *     responses:
     *       200:
     *         description: Users retrieved
     */
    this.router.get(
      `${this.path}/all-users`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getAllUsers
    );

    /**
     * @openapi
     * /api/admin/users/{id}:
     *   get:
     *     tags: [admin]
     *     summary: Retrieve a user by id
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User retrieved
     */
    this.router.get(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getUserById
    );

    /**
     * @openapi
     * /api/admin/users/{id}:
     *   patch:
     *     tags: [admin]
     *     summary: Update a user's profile attributes
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/AdminUpdateUser'
     *     responses:
     *       200:
     *         description: User updated
     */
    this.router.patch(
      `${this.path}/users/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateUpdateUser),
      ],
      this.updateUser
    );

    /**
     * @openapi
     * /api/admin/users/{id}:
     *   delete:
     *     tags: [admin]
     *     summary: Permanently delete a user
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User deleted
     */
    this.router.delete(
      `${this.path}/users/:id`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.deleteUser
    );

    /**
     * @openapi
     * /api/admin/users/{id}/ban:
     *   post:
     *     tags: [admin]
     *     summary: Ban a user account
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User banned
     */
    this.router.post(
      `${this.path}/users/:id/ban`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.banUser
    );

    /**
     * @openapi
     * /api/admin/users/{id}/unban:
     *   post:
     *     tags: [admin]
     *     summary: Lift ban on a user
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User unbanned
     */
    this.router.post(
      `${this.path}/users/:id/unban`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.unbanUser
    );

    /**
     * Privilledges and control
     */
    /**
     * @openapi
     * /api/admin/roles:
     *   get:
     *     tags: [admin]
     *     summary: List available roles
     *     responses:
     *       200:
     *         description: Roles retrieved
     */
    this.router.get(
      `${this.path}/roles`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getRoles
    );

    /**
     * @openapi
     * /api/admin/statuses:
     *   get:
     *     tags: [admin]
     *     summary: List available statuses
     *     responses:
     *       200:
     *         description: Statuses retrieved
     */
    this.router.get(
      `${this.path}/statuses`,
      [authenticatedMiddleware, verifyRolesMiddleware([UserRole.Admin])],
      this.getStatuses
    );

    /**
     * @openapi
     * /api/admin/users/{id}/role:
     *   patch:
     *     tags: [admin]
     *     summary: Change a user's role
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userRole:
     *                 type: string
     *                 enum: ["admin","staff","customer"]
     *             required: [userRole]
     *     responses:
     *       200:
     *         description: User role updated
     */
    this.router.patch(
      `${this.path}/users/:id/role`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserRole),
      ],
      this.changeUserRole
    );

    /**
     * @openapi
     * /api/admin/users/{id}/tier:
     *   patch:
     *     tags: [admin]
     *     summary: Change a user's subscription tier
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userTiers:
     *                 type: string
     *                 enum: ["basic","premium","business"]
     *             required: [userTiers]
     *     responses:
     *       200:
     *         description: User tier updated
     */
    this.router.patch(
      `${this.path}/users/:id/tier`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserTier),
      ],
      this.changeUserTier
    );

    /**
     * @openapi
     * /api/admin/users/{id}/status:
     *   patch:
     *     tags: [admin]
     *     summary: Change a user's status
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userStatus:
     *                 type: string
     *                 enum: ["active","banned","suspended"]
     *             required: [userStatus]
     *     responses:
     *       200:
     *         description: User status updated
     */
    this.router.patch(
      `${this.path}/users/:id/status`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateChangeUserStatus),
      ],
      this.changeUserStatus
    );

    /**
     * Cards
     */
    this.router.get(
      `${this.path}/get-all-cards`,
      [authenticatedMiddleware],
      verifyRolesMiddleware([UserRole.Admin]),
      this.getAllCards
    );

    /**
     * Subscription
     */
    /**
     * @openapi
     * /api/admin/subscription-tiers:
     *   post:
     *     tags: [admin]
     *     summary: Create a new subscription tier
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [name, billingCycle, description, trialPeriod, autoRenew, features]
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the subscription tier
     *                 example: "premium"
     *               billingCycle:
     *                 type: object
     *                 required: [monthly, yearly]
     *                 properties:
     *                   monthly:
     *                     type: object
     *                     required: [priceUSD, priceNGN, stripePlanCode, paystackPlanCode]
     *                     properties:
     *                       priceUSD:
     *                         type: number
     *                         description: Monthly price in USD
     *                         example: 10
     *                       priceNGN:
     *                         type: number
     *                         description: Monthly price in Nigerian Naira
     *                         example: 5000
     *                       durationInDays:
     *                         type: number
     *                         description: Duration in days (default: 30)
     *                         example: 30
     *                       stripePlanCode:
     *                         type: string
     *                         description: Stripe Price ID for USD payments
     *                         example: "price_1XYZ..."
     *                       paystackPlanCode:
     *                         type: string
     *                         description: Paystack Plan Code for NGN payments
     *                         example: "PLN_abc123"
     *                   yearly:
     *                     type: object
     *                     required: [priceUSD, priceNGN, stripePlanCode, paystackPlanCode]
     *                     properties:
     *                       priceUSD:
     *                         type: number
     *                         description: Yearly price in USD
     *                         example: 100
     *                       priceNGN:
     *                         type: number
     *                         description: Yearly price in Nigerian Naira
     *                         example: 50000
     *                       durationInDays:
     *                         type: number
     *                         description: Duration in days (default: 365)
     *                         example: 365
     *                       stripePlanCode:
     *                         type: string
     *                         description: Stripe Price ID for USD payments
     *                         example: "price_2ABC..."
     *                       paystackPlanCode:
     *                         type: string
     *                         description: Paystack Plan Code for NGN payments
     *                         example: "PLN_def456"
     *               description:
     *                 type: string
     *                 description: Description of the subscription tier
     *                 example: "Premium tier with all features"
     *               trialPeriod:
     *                 type: number
     *                 description: Trial period in days
     *                 example: 7
     *               autoRenew:
     *                 type: boolean
     *                 description: Whether subscription auto-renews
     *                 example: true
     *               features:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: List of features included in this tier
     *                 example: ["feature1", "feature2", "feature3"]
     *     responses:
     *       201:
     *         description: Subscription tier created successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 201
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "Subscription tier created successfully"
     *                 payload:
     *                   type: object
     *                   description: The created subscription tier
     *       400:
     *         description: Bad request - Invalid data provided
     *       401:
     *         description: Unauthorized - Admin access required
     *       409:
     *         description: Conflict - Subscription tier already exists
     */
    this.router.post(
      `${this.path}/subscription-tiers`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateSubscriptionTier),
      ],
      this.createSubscriptionTier
    );

    /**
     * @openapi
     * /api/admin/subscription-tiers:
     *   get:
     *     tags: [admin]
     *     summary: List all subscription tiers (lightweight)
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Subscription tiers retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "Subscription tiers retrieved successfully"
     *                 payload:
     *                   type: array
     *                   items:
     *                     type: object
     *                     properties:
     *                       id:
     *                         type: string
     *                         example: "64a1b2c3d4e5f6789012345"
     *                       name:
     *                         type: string
     *                         example: "premium"
     */
    this.router.get(
      `${this.path}/subscription-tiers`,
      [authenticatedMiddleware],
      this.getSubscriptionTiers
    );

    /**
     * @openapi
     * /api/admin/subscription-tiers/{id}:
     *   get:
     *     tags: [admin]
     *     summary: Get subscription tier details by ID
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: Subscription tier retrieved successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "Subscription tier retrieved successfully"
     *                 payload:
     *                   $ref: '#/components/schemas/SubscriptionTier'
     *       404:
     *         description: Subscription tier not found
     */
    this.router.get(
      `${this.path}/subscription-tiers/:id`,
      [authenticatedMiddleware],
      this.getSubscriptionTierById
    );

    /**
     * @openapi
     * /api/admin/subscription-tiers/{id}:
     *   patch:
     *     tags: [admin]
     *     summary: Update a subscription tier
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Subscription tier ID
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               name:
     *                 type: string
     *                 description: Name of the subscription tier
     *                 example: "premium"
     *               billingCycle:
     *                 type: object
     *                 properties:
     *                   monthly:
     *                     type: object
     *                     properties:
     *                       priceUSD:
     *                         type: number
     *                         description: Monthly price in USD
     *                         example: 10
     *                       priceNGN:
     *                         type: number
     *                         description: Monthly price in NGN
     *                         example: 5000
     *                       durationInDays:
     *                         type: number
     *                         description: Duration in days (default: 30)
     *                         example: 30
     *                       stripePlanCode:
     *                         type: string
     *                         description: Stripe Price ID for USD payments
     *                         example: "price_1XYZ..."
     *                       paystackPlanCode:
     *                         type: string
     *                         description: Paystack Plan Code for NGN payments
     *                         example: "PLN_abc123"
     *                   yearly:
     *                     type: object
     *                     properties:
     *                       priceUSD:
     *                         type: number
     *                         description: Yearly price in USD
     *                         example: 100
     *                       priceNGN:
     *                         type: number
     *                         description: Yearly price in NGN
     *                         example: 50000
     *                       durationInDays:
     *                         type: number
     *                         description: Duration in days (default: 365)
     *                         example: 365
     *                       stripePlanCode:
     *                         type: string
     *                         description: Stripe Price ID for USD payments
     *                         example: "price_2ABC..."
     *                       paystackPlanCode:
     *                         type: string
     *                         description: Paystack Plan Code for NGN payments
     *                         example: "PLN_def456"
     *               description:
     *                 type: string
     *                 description: Description of the subscription tier
     *                 example: "Premium tier with all features"
     *               trialPeriod:
     *                 type: number
     *                 description: Trial period in days
     *                 example: 7
     *               autoRenew:
     *                 type: boolean
     *                 description: Whether subscription auto-renews
     *                 example: true
     *               features:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: List of features included in this tier
     *                 example: ["feature1", "feature2", "feature3"]
     *     responses:
     *       200:
     *         description: Subscription tier updated successfully
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 statusCode:
     *                   type: number
     *                   example: 200
     *                 status:
     *                   type: string
     *                   example: "success"
     *                 message:
     *                   type: string
     *                   example: "Subscription tier updated successfully"
     *                 payload:
     *                   type: object
     *                   description: The updated subscription tier
     *       400:
     *         description: Bad request - Invalid data provided
     *       401:
     *         description: Unauthorized - Admin access required
     *       404:
     *         description: Subscription tier not found
     */
    this.router.patch(
      `${this.path}/subscription-tiers/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateSubscriptionTierUpdate),
      ],
      this.updateSubscriptionTier
    );

    /**
     * @openapi
     * /api/admin/subscription-tiers/{id}:
     *   delete:
     *     tags: [admin]
     *     summary: Delete a subscription tier (requires reassignment target)
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *         description: Subscription tier ID to delete
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [newTierId]
     *             properties:
     *               newTierId:
     *                 type: string
     *                 description: Tier ID to migrate existing subscribers to
     *                 example: "64a1b2c3d4e5f6789012345"
     *     responses:
     *       200:
     *         description: Subscription tier deleted successfully
     *       400:
     *         description: Bad request - Missing reassignment tier
     *       401:
     *         description: Unauthorized - Admin access required
     *       404:
     *         description: Subscription tier not found
     */
    this.router.delete(
      `${this.path}/subscription-tiers/:id`,
      [
        authenticatedMiddleware,
        verifyRolesMiddleware([UserRole.Admin]),
        validationMiddleware(validateDeleteSubscriptionTier),
      ],
      this.deleteSubscriptionTier
    );

    /**
     * Security
     */
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

  /**
   * Fetch details of all users
   */
  private getAllUsers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
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

  /**
   * Fetch all cards
   */
  private getAllCards = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const cards = await this.adminService.getAllCards();
      res.status(200).json({
        status: "success",
        message: "Cards retrieved successfully",
        payload: cards,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);

      next(
        new HttpException(
          500,
          "error",
          error instanceof Error ? error.message : "An unknown error occurred"
        )
      );
    }
  };

  /**
   * Create subscription tier
   */
  private createSubscriptionTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const tierData: CreateSubscriptionTier = req.body;

      const newTier = await this.adminService.createSubscriptionTier(tierData);

      res.status(201).json({
        statusCode: 201,
        status: "success",
        message: "Subscription tier created successfully",
        payload: newTier,
      });
    } catch (error) {
      next(error);
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

  private getSubscriptionTierById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const tier = await this.adminService.getSubscriptionTierById(id);
      res.status(200).json({
        status: "success",
        message: "Subscription tier retrieved successfully",
        payload: tier,
      });
    } catch (error) {
      console.error(`ERROR: ${error}`);
      next(
        new HttpException(
          400,
          "Failed to retrieve subscription tier",
          error.message
        )
      );
    }
  };

  /**
   * Update subscription tier
   */
  private updateSubscriptionTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: Partial<CreateSubscriptionTier> = req.body;

      const updatedTier = await this.adminService.updateSubscriptionTier(
        id,
        updateData
      );

      if (!updatedTier) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "Subscription tier not found",
        });
      }

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Subscription tier updated successfully",
        payload: updatedTier,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete subscription tier
   */
  private deleteSubscriptionTier = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params; // Subscription tier to be deleted
      const { newTierId } = req.body; // New tier for user transfer

      const newTier = await this.adminService.getSubscriptionTierById(
        newTierId
      );
      if (!newTier) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "New subscription tier not found",
        });
      }

      // Ensure the tier to be deleted exists
      const tierToDelete = await this.adminService.getSubscriptionTierById(id);
      if (!tierToDelete) {
        res.status(404).json({
          statusCode: 404,
          status: "error",
          message: "Subscription tier not found",
        });
      }

      // Check if this is the last remaining subscription tier
      const totalTiers = await this.adminService.getSubscriptionTierCount();
      if (totalTiers <= 1) {
        res.status(400).json({
          statusCode: 400,
          status: "error",
          message: "Cannot delete the last remaining subscription tier",
        });
      }

      // Transfer users to the new tier
      await this.adminService.transferUsersToNewTier(id, newTierId);

      // Now delete the tier
      await this.adminService.deleteSubscriptionTier(id);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        message: "Subscription tier deleted and users transferred successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Turn on and off maintenance mode
   */
  private toggleMaintenance = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { enabled } = req.body;
      const response = await this.adminService.toggleMaintenanceMode(enabled);
      res.status(201).json({ message: response });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Turn on 2fa authentication
   */
  private assignGlobal2FA = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const response = await this.adminService.enable2FAGlobally();
      res.status(201).json({ message: "Global 2FA enabled", response });
    } catch (error) {
      next(new HttpException(500, "Internal Server Error", error.message));
    }
  };
}

export default AdminController;
