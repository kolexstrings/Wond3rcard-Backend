import { Request, Response, NextFunction, Router } from "express";
import stripe from "../../../config/stripe";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import TransactionModel from "../transactions.model";
import userModel from "../../user/user.model";
import StripeSubscriptionService from "./stripe.service";
import StripeOrderService from "../../physical-card/order-physical-card/stripe/stripe.service";
import validationMiddleware from "../../../middlewares/validation.middleware";
import { validateStripePayment } from "./stripe.vaidations";

class StripeController {
  public path = "/stripe";
  public router = Router();
  private stripeSubscriptionService = new StripeSubscriptionService();
  private stripeCardOrderService = new StripeOrderService();

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
      const session =
        await this.stripeSubscriptionService.createCheckoutSession(
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
}

export default StripeController;
