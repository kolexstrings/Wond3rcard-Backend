import { Request, Response, NextFunction, Router } from "express";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import validationMiddleware from "../../../middlewares/validation.middleware";
import verifyRolesMiddleware from "../../../middlewares/roles.middleware";
import {
  validateManualPayment,
  validateManualCancelSubscription,
  validateManualChangeSubscription,
} from "./manual.validations";
import { UserRole } from "../../user/user.protocol";
import ManualPaymentService from "./manual.service";

class ManualPaymentController {
  public path = "/manual-payment";
  public router = Router();
  private manualPaymentService = new ManualPaymentService();
  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @openapi
     * /api/manual-payment/initialize-payment:
     *   post:
     *     tags: [manual-payment]
     *     summary: Initialize a manual payment (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/InitializeManualPayment'
     *     responses:
     *       201:
     *         description: Payment initialized
     */
    this.router.post(
      `${this.path}/initialize-payment`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateManualPayment),
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.createManualPayment
    );

    /**
     * @openapi
     * /api/manual-payment/cancel-subscription:
     *   post:
     *     tags: [manual-payment]
     *     summary: Cancel an existing manual subscription (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [userId]
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Target user whose manual subscription should be cancelled
     *     responses:
     *       200:
     *         description: Manual subscription cancelled
     */
    this.router.post(
      `${this.path}/cancel-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateManualCancelSubscription),
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.cancelManualSubscription
    );

    /**
     * @openapi
     * /api/manual-payment/change-subscription:
     *   post:
     *     tags: [manual-payment]
     *     summary: Change a user's manual subscription plan (Admin only)
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [userId, newPlan, billingCycle]
     *             properties:
     *               userId:
     *                 type: string
     *               newPlan:
     *                 type: string
     *                 enum: [basic, premium, business]
     *               billingCycle:
     *                 type: string
     *                 enum: [monthly, yearly]
     *               amount:
     *                 type: number
     *                 description: Optional amount recorded for the manual adjustment
     *               paymentMethod:
     *                 type: string
     *                 description: Optional description of the manual payment method
     *               durationInDays:
     *                 type: number
     *                 description: Optional override for subscription duration in days
     *     responses:
     *       200:
     *         description: Manual subscription updated
     */
    this.router.post(
      `${this.path}/change-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateManualChangeSubscription),
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.changeManualSubscription
    );
  }

  private createManualPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.manualPaymentService.createManualPayment(
        req.body
      );
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  private cancelManualSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId } = req.body;
      const result = await this.manualPaymentService.cancelManualSubscription(
        userId
      );
      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private changeManualSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await this.manualPaymentService.changeManualSubscription(
        req.body
      );

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default ManualPaymentController;
