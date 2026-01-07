import { Request, Response, NextFunction, Router } from "express";
import stripe from "../../../config/stripe";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import TransactionModel from "../transactions.model";
import userModel from "../../user/user.model";
import StripeSubscriptionService from "./stripe.service";
import StripeOrderService from "../../physical-card/order-physical-card/stripe/stripe.service";
import validationMiddleware from "../../../middlewares/validation.middleware";
import HttpException from "../../../exceptions/http.exception";
import { UserRole } from "../../user/user.protocol";
import {
  validateStripePayment,
  validateStripeCancelSubscription,
  validateStripeChangeSubscription,
} from "./stripe.vaidations";

class StripeController {
  public path = "/stripe";
  public router = Router();
  private stripeSubscriptionService = new StripeSubscriptionService();
  private stripeCardOrderService = new StripeOrderService();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    /**
     * @openapi
     * /api/stripe/initialize-payment:
     *   post:
     *     tags: [stripe]
     *     summary: Initialize a Stripe payment session
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [userId, plan, billingCycle]
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
     *         description: Checkout URL returned
     */
    this.router.post(
      `${this.path}/initialize-payment`,
      [authenticatedMiddleware, validationMiddleware(validateStripePayment)],
      this.createCheckoutSession
    );

    /**
     * @openapi
     * /api/stripe/cancel-subscription:
     *   post:
     *     tags: [stripe]
     *     summary: Cancel the authenticated user's active Stripe subscription
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: false
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Optional override (admin only)
     *               subscriptionId:
     *                 type: string
     *                 description: Stripe subscription identifier to cancel. Defaults to the caller's active subscription.
     *     responses:
     *       200:
     *         description: Cancellation scheduled
     */
    this.router.post(
      `${this.path}/cancel-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateStripeCancelSubscription),
      ],
      this.cancelSubscription
    );

    /**
     * @openapi
     * /api/stripe/change-subscription:
     *   post:
     *     tags: [stripe]
     *     summary: Upgrade or downgrade a Stripe subscription
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required: [newPlan, billingCycle]
     *             properties:
     *               userId:
     *                 type: string
     *                 description: Optional override (admin only)
     *               newPlan:
     *                 type: string
     *                 enum: [basic, premium, business]
     *               billingCycle:
     *                 type: string
     *                 enum: [monthly, yearly]
     *     responses:
     *       200:
     *         description: Subscription change initiated
     */
    this.router.post(
      `${this.path}/change-subscription`,
      [
        authenticatedMiddleware,
        validationMiddleware(validateStripeChangeSubscription),
      ],
      this.changeSubscription
    );

    /**
     * @openapi
     * /api/stripe/webhook:
     *   post:
     *     tags: [stripe]
     *     summary: Handle Stripe webhook events
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *     responses:
     *       200:
     *         description: Webhook processed
     */
    this.router.post(`${this.path}/webhook`, this.handleWebhook);
  }

  private createCheckoutSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { plan, billingCycle } = req.body;
      const targetUserId = this.resolveTargetUserId(req.user, req.body.userId);

      const session =
        await this.stripeSubscriptionService.createCheckoutSession(
          targetUserId,
          plan,
          billingCycle
        );

      if (session.type === "checkout") {
        return res.status(200).json({
          statusCode: 200,
          status: "success",
          payload: {
            checkoutUrl: session.url,
          },
        });
      }

      return res.status(200).json({
        statusCode: 200,
        status: "success",
        payload: {
          subscriptionId: session.subscriptionId,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  private handleWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const sig = req.headers["stripe-signature"] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle different event types
    if (event.type === "checkout.session.completed") {
      try {
        const session = event.data.object as any;
        const metadata = session.metadata; // Metadata sent when creating the session

        if (!metadata || !metadata.transactionType) {
          return res
            .status(400)
            .json({ message: "Missing transaction type in metadata" });
        }

        if (metadata.transactionType === "subscription") {
          await this.stripeSubscriptionService.handleSuccessfulSubscription(
            session
          );
        } else if (metadata.transactionType === "card_order") {
          await this.stripeCardOrderService.handleSuccessfulCardOrder(session);
        } else {
          return res.status(400).json({ message: "Unknown transaction type" });
        }

        return res.json({ received: true });
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    }

    res.status(400).json({ message: "Unhandled event type" });
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
  ) => {
    try {
      const body = req.body || {};
      const targetUserId = this.resolveTargetUserId(req.user, body.userId);

      const result = await this.stripeSubscriptionService.cancelSubscription({
        targetUserId,
        subscriptionId: body.subscriptionId,
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
  ) => {
    try {
      const targetUserId = this.resolveTargetUserId(req.user, req.body.userId);
      const { newPlan, billingCycle } = req.body;

      const result = await this.stripeSubscriptionService.changeSubscription({
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

export default StripeController;
