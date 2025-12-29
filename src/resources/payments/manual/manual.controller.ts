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

    this.router.post(
      `${this.path}/cancel-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateManualCancelSubscription),
        verifyRolesMiddleware([UserRole.Admin]),
      ],
      this.cancelManualSubscription
    );

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
