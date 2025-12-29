import { NextFunction, Request, Response, Router } from "express";
import HttpException from "../../../exceptions/http.exception";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import GeneralController from "../../../protocols/global.controller";
import PaystackSubscriptionService from "./paystack.service";
import PaystackOrderService from "../../physical-card/order-physical-card/paystack/paystack.service";
import userModel from "../../user/user.model";
import { UserRole } from "../../user/user.protocol";
import validationMiddleware from "../../../middlewares/validation.middleware";
import {
  validateCancelSubscription,
  validateChangeSubscription,
  validatePaystackPayment,
  validateWebhookPayload,
} from "./paystack.validations";
import crypto from "crypto";

class PaystackController implements GeneralController {
  public path = "/paystack";
  public router = Router();
  private paystackSubscriptionService = new PaystackSubscriptionService();
  private paystackCardOrderService = new PaystackOrderService();

  constructor() {
    this.initializeRoute();
  }

  private initializeRoute(): void {
    /**
     * @openapi
     * /api/paystack/initialize-payment:
     *   post:
     *     tags:
     *       - paystack
     *     summary: Initialize a Paystack subscription payment
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - plan
     *               - billingCycle
     *             properties:
     *               userId:
     *                 type: string
     *               plan:
     *                 type: string
     *               billingCycle:
     *                 type: string
     *                 enum: [monthly, yearly]
     *     responses:
     *       200:
     *         description: Checkout URL or subscription details returned
     */
    this.router.post(
      `${this.path}/initialize-payment`,
      [authenticatedMiddleware, validationMiddleware(validatePaystackPayment)],
      this.initializePayment
    );

    this.router.post(
      `${this.path}/webhook`,
      validationMiddleware(validateWebhookPayload),
      this.handleWebhook
    );

    this.router.get(`${this.path}/verify/:reference`, this.verifyTransaction);

    /**
     * @openapi
     * /api/paystack/cancel-subscription:
     *   post:
     *     tags:
     *       - paystack
     *     summary: Cancel the authenticated user's active Paystack subscription
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - subscriptionId
     *             properties:
     *               userId:
     *                 type: string
     *               subscriptionId:
     *                 type: string
     *                 description: Paystack subscription identifier
     *     responses:
     *       200:
     *         description: Subscription cancelled
     */
    this.router.post(
      `${this.path}/cancel-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateCancelSubscription),
      ],
      this.cancelSubscription
    );

    /**
     * @openapi
     * /api/paystack/change-subscription:
     *   post:
     *     tags:
     *       - paystack
     *     summary: Upgrade or downgrade an existing Paystack subscription
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - userId
     *               - newPlan
     *               - billingCycle
     *             properties:
     *               userId:
     *                 type: string
     *               newPlan:
     *                 type: string
     *                 enum: [basic, premium, business]
     *               billingCycle:
     *                 type: string
     *                 enum: [monthly, yearly]
     *     responses:
     *       200:
     *         description: Subscription updated
     */
    this.router.post(
      `${this.path}/change-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateChangeSubscription),
      ],
      this.changeSubscription
    );
  }

  private initializePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { userId, plan, billingCycle } = req.body;

      if (!["monthly", "yearly"].includes(billingCycle)) {
        return next(new HttpException(400, "error", "Invalid billing cycle"));
      }

      const result = await this.paystackSubscriptionService.initializePayment(
        userId,
        plan,
        billingCycle
      );

      if (result.type === "payment") {
        // User needs to make payment via checkout link
        res.status(200).json({
          statusCode: 200,
          status: "success",
          payload: {
            checkoutUrl: result.checkoutUrl,
            reference: result.reference,
          },
        });
      } else if (result.type === "subscription") {
        // Subscription already created using existing card
        res.status(200).json({
          statusCode: 200,
          status: "success",
          payload: {
            subscription: result.subscriptionData,
          },
        });
      } else {
        res.status(500).json({
          statusCode: 500,
          status: "error",
          message: "Unexpected response from payment service",
        });
      }
    } catch (error: any) {
      next(error);
    }
  };

  private handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const paystackSignature = req.headers["x-paystack-signature"];
      if (!paystackSignature) {
        return next(new HttpException(401, "error", "Unauthorized"));
      }

      // Verify signature
      const secret = process.env.PAYSTACK_SECRET as string;
      const hash = crypto
        .createHmac("sha512", secret)
        .update(JSON.stringify(req.body))
        .digest("hex");

      if (hash !== paystackSignature) {
        return next(new HttpException(403, "error", "Invalid signature"));
      }

      const { event, data } = req.body;

      if (event === "charge.success") {
        try {
          const { metadata } = data;

          if (!metadata || !metadata.transactionType) {
            res.status(400).json({ message: "Missing transaction type" });
          }

          let result;

          switch (metadata.transactionType) {
            case "subscription":
              result =
                await this.paystackSubscriptionService.handleSuccessfulSubscription(
                  data
                );
              break;

            case "card_order":
              result =
                await this.paystackCardOrderService.handleSuccessfulCardOrder(
                  data
                );
              break;

            default:
              res.status(400).json({ message: "Unknown transaction type" });
          }

          res.status(200).json(result);
        } catch (error) {
          console.error("Error processing webhook:", error);
          res
            .status(200)
            .json({ message: "Webhook received but processing failed" });
        }
      } else {
        res.status(400).json({ message: "Unhandled event" });
      }
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  };

  private verifyTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { reference } = req.params;
      if (!reference) {
        return next(
          new HttpException(400, "error", "Transaction reference is required")
        );
      }

      const verification =
        await this.paystackSubscriptionService.verifyTransaction(reference);

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: verification.data,
      });
    } catch (error) {
      next(error);
    }
  };

  private resolveTargetUserId = (
    user: any,
    requestedUserId?: string
  ): string => {
    const authenticatedId = user?._id?.toString() ?? user?.id;

    if (!requestedUserId || requestedUserId === authenticatedId) {
      return authenticatedId;
    }

    if (user.userRole !== UserRole.Admin) {
      throw new HttpException(
        403,
        "error",
        "You are not authorized to manage another user's subscription"
      );
    }

    return requestedUserId;
  };

  private cancelSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authUser = req.user;
      const targetUserId = this.resolveTargetUserId(authUser, req.body.userId);
      const { subscriptionId } = req.body;

      const result = await this.paystackSubscriptionService.cancelSubscription({
        targetUserId,
        subscriptionId,
      });

      res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: result,
      });
    } catch (error) {
      next(error);
    }
  };

  private changeSubscription = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { newPlan, billingCycle } = req.body;
      const authUser = req.user;
      const targetUserId = this.resolveTargetUserId(authUser, req.body.userId);

      if (!["monthly", "yearly"].includes(billingCycle)) {
        return next(new HttpException(400, "error", "Invalid billing cycle"));
      }

      const result = await this.paystackSubscriptionService.changeSubscription({
        targetUserId,
        newPlan,
        billingCycle,
      });

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

export default PaystackController;
