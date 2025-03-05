import { Request, Response, NextFunction, Router } from "express";
import stripe from "../../../config/stripe";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import TransactionModel from "../transactions.model";
import userModel from "../../user/user.model";
import stripeService from "./stripe.service";
import validationMiddleware from "../../../middlewares/validation.middleware";
import { validateStripePayment } from "./stripe.vaidation";

class StripeController {
  public path = "/stripe";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/initialize-payment`,
      [authenticatedMiddleware, validationMiddleware(validateStripePayment)],
      this.createCheckoutSession
    );
    this.router.post(`${this.path}/webhook`, this.handleWebhook);
  }

  private createCheckoutSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { userId, plan, billingCycle } = req.body;
      const session = await stripeService.createCheckoutSession(
        userId,
        plan,
        billingCycle
      );
      res.status(200).json({ url: session.url });
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

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as any;

      const { userId, plan, billingCycle, expiresAt } = session.metadata;

      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const transactionId = session.id;
      const referenceId = session.payment_intent || transactionId;
      const paymentMethod = session.payment_method_types?.[0] || "unknown";
      const paidAt = new Date(session.created * 1000); // Stripe timestamps are in seconds

      user.userTier = {
        plan,
        status: "active",
        transactionId,
        expiresAt: new Date(expiresAt), // Convert metadata string to Date object
      };
      await user.save();

      // Store transaction details
      await TransactionModel.create({
        userId,
        userName: user.username,
        email: user.email,
        plan,
        billingCycle,
        amount: session.amount_total / 100,
        referenceId,
        transactionId,
        paymentProvider: "stripe",
        status: "success",
        paymentMethod,
        paidAt,
        expiresAt: new Date(expiresAt),
      });

      return res.json({ received: true });
    }

    res.status(400).json({ message: "Unhandled event type" });
  };
}

export default StripeController;
