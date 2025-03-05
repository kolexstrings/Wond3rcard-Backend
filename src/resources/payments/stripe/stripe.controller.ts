import { Request, Response, NextFunction, Router } from "express";
import stripe from "../../../config/stripe";
import authenticatedMiddleware from "../../../middlewares/authenticated.middleware";
import TransactionModel from "../transactions.model";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";

class StripeController {
  public path = "/stripe";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/create-checkout-session`,
      authenticatedMiddleware,
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
      const tier = await tierModel.findOne({ name: plan }).lean();
      if (!tier) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      const selectedBilling =
        billingCycle === "yearly"
          ? tier.billingCycle.yearly
          : tier.billingCycle.monthly;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan,
              },
              unit_amount: selectedBilling.price * 100, // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          userId,
          plan,
          billingCycle,
          expiresAt: new Date(
            Date.now() + selectedBilling.durationInDays * 24 * 60 * 60 * 1000
          ).toISOString(), // Expiry Date
        },
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-failed`,
      });

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
