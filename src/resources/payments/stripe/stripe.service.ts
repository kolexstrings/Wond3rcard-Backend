import stripe from "../../../config/stripe";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import TransactionModel from "../transactions.model";
import { generateTransactionId } from "../../../utils/generateTransactionId";

class StripeSubscriptionService {
  async createCheckoutSession(
    userId: string,
    plan: string,
    billingCycle: string
  ) {
    const tier = await tierModel.findOne({ name: plan }).lean();
    if (!tier) throw new Error("Invalid plan selected");

    const selectedBilling =
      billingCycle === "yearly"
        ? tier.billingCycle.yearly
        : tier.billingCycle.monthly;

    return await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan },
            unit_amount: selectedBilling.price * 100,
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: { userId, plan, billingCycle },
      success_url: `${process.env.FRONTEND_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`,
    });
  }

  public async handleSuccessfulSubscription(session: any) {
    const { userId, plan, billingCycle, expiresAt } = session.metadata;

    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const transactionId = session.id; // Stripe’s unique ID
    const referenceId = generateTransactionId("subscription", "stripe"); // Custom transaction ID
    const paymentMethod = session.payment_method_types?.[0] || "unknown";
    const paidAt = new Date(session.created * 1000); // Stripe timestamps in seconds

    // Update user subscription
    user.userTier = {
      plan,
      status: "active",
      transactionId,
      expiresAt: new Date(expiresAt),
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
      referenceId, // Custom transaction ID
      transactionId, // Stripe's ID
      paymentProvider: "stripe",
      status: "success",
      paymentMethod,
      paidAt,
      expiresAt: new Date(expiresAt),
    });

    return { received: true };
  }
}

export default StripeSubscriptionService;
