import stripe from "../../../config/stripe";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import TransactionModel from "../transactions.model";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { UserTiers } from "../../user/user.protocol";

type InitializeStripePaymentResult =
  | { type: "checkout"; url: string }
  | { type: "subscription"; subscriptionId: string };

type StripeChangeSubscriptionParams = {
  targetUserId: string;
  newPlan: UserTiers;
  billingCycle: "monthly" | "yearly";
};

type StripeCancelSubscriptionParams = {
  targetUserId: string;
  subscriptionId: string;
};

class StripeSubscriptionService {
  // async createCheckoutSession(
  //   userId: string,
  //   plan: string,
  //   billingCycle: string
  // ) {
  //   const tier = await tierModel.findOne({ name: plan }).lean();
  //   if (!tier) throw new Error("Invalid plan selected");

  //   const selectedBilling =
  //     billingCycle === "yearly"
  //       ? tier.billingCycle.yearly
  //       : tier.billingCycle.monthly;

  //   return await stripe.checkout.sessions.create({
  //     payment_method_types: ["card"],
  //     line_items: [
  //       {
  //         price_data: {
  //           currency: "usd",
  //           product_data: { name: plan },
  //           unit_amount: selectedBilling.price * 100,
  //         },
  //         quantity: 1,
  //       },
  //     ],
  //     mode: "subscription",
  //     metadata: { userId, plan, billingCycle, transactionType: "subscription" },
  //     success_url: `${process.env.FRONTEND_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  //     cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`,
  //   });
  // }

  async createCheckoutSession(
    userId: string,
    plan: string,
    billingCycle: "monthly" | "yearly"
  ): Promise<InitializeStripePaymentResult> {
    const tier = await tierModel.findOne({ name: plan }).lean();
    if (!tier) throw new HttpException(404, "error", "Invalid plan selected");

    const selectedBilling =
      billingCycle === "yearly"
        ? tier.billingCycle.yearly
        : tier.billingCycle.monthly;

    const planCode = selectedBilling.planCode;
    if (!planCode)
      throw new HttpException(
        500,
        "error",
        "PlanCode not configured for this plan"
      );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: planCode,
          quantity: 1,
        },
      ],
      mode: "subscription",
      metadata: {
        userId,
        plan,
        billingCycle,
        transactionType: "subscription",
      },
      success_url: `${process.env.FRONTEND_BASE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_BASE_URL}/payment-failed`,
    });

    if (!session.url) {
      throw new HttpException(
        502,
        "error",
        "Stripe did not return a checkout URL"
      );
    }

    return { type: "checkout", url: session.url };
  }

  public async handleSuccessfulSubscription(session: any) {
    const { userId, plan, billingCycle, expiresAt } = session.metadata;

    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const transactionId = session.id; // Stripe’s unique ID
    const subscriptionCode = session.subscription; // Extract the subscription ID
    const referenceId = generateTransactionId("subscription", "stripe"); // Custom transaction ID
    const paymentMethod = session.payment_method_types?.[0] || "unknown";
    const paidAt = new Date(session.created * 1000); // Stripe timestamps in seconds

    // Update user subscription
    user.userTier = {
      plan,
      status: "active",
      transactionId,
      subscriptionCode,
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
      transactionType: "subscription",
      subscriptionCode,
      paymentProvider: "stripe",
      status: "success",
      paymentMethod,
      paidAt,
      expiresAt: new Date(expiresAt),
    });

    return { received: true };
  }

  public async cancelSubscription({
    targetUserId,
    subscriptionId,
  }: StripeCancelSubscriptionParams) {
    const user = await userModel.findById(targetUserId);
    if (!user) {
      throw new HttpException(404, "error", "User not found");
    }

    const activeSubscriptionCode =
      user.userTier.subscriptionCode ||
      user.activeSubscription?.subscriptionId ||
      null;

    if (!activeSubscriptionCode || user.userTier.status !== "active") {
      throw new HttpException(
        400,
        "error",
        "User does not have an active Stripe subscription"
      );
    }

    if (subscriptionId !== activeSubscriptionCode) {
      throw new HttpException(
        400,
        "error",
        "Provided subscription ID does not match the active subscription"
      );
    }

    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    user.userTier.status = "inactive";
    user.userTier.subscriptionCode = null;
    user.userTier.transactionId = null;
    user.userTier.expiresAt = null;

    if (user.activeSubscription?.provider === "stripe") {
      user.activeSubscription.provider = null;
      user.activeSubscription.subscriptionId = null;
      user.activeSubscription.expiryDate = null;
    }

    await user.save();

    return {
      message: "Stripe subscription cancellation scheduled",
      subscriptionId,
    };
  }

  public async changeSubscription({
    targetUserId,
    newPlan,
    billingCycle,
  }: StripeChangeSubscriptionParams) {
    const user = await userModel.findById(targetUserId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const normalizedPlan = newPlan.toLowerCase();
    const tier = await tierModel.findOne({ name: normalizedPlan });
    if (!tier)
      throw new HttpException(404, "error", "Subscription tier not found");

    const newPriceId = tier.billingCycle[billingCycle].planCode;
    if (!newPriceId)
      throw new HttpException(
        500,
        "error",
        "PlanCode not configured for requested tier"
      );

    const activeSubscriptionCode =
      user.userTier.subscriptionCode ||
      user.activeSubscription?.subscriptionId ||
      null;

    if (!activeSubscriptionCode) {
      const session = await this.createCheckoutSession(
        targetUserId,
        normalizedPlan,
        billingCycle
      );

      user.userTier.plan = newPlan;
      user.userTier.status = "inactive";
      user.userTier.transactionId = null;
      user.userTier.subscriptionCode = null;
      user.userTier.expiresAt = null;
      user.activeSubscription = {
        provider: "stripe",
        subscriptionId: null,
        expiryDate: null,
      };

      await user.save();

      return {
        message: "Stripe subscription change requires checkout",
        nextAction: "complete_payment",
        data: session,
      };
    }

    const subscription = await stripe.subscriptions.retrieve(
      activeSubscriptionCode
    );

    if (!subscription) {
      throw new HttpException(
        404,
        "error",
        "Stripe subscription not found for user"
      );
    }

    const updatedSubscription = await stripe.subscriptions.update(
      activeSubscriptionCode,
      {
        cancel_at_period_end: false,
        proration_behavior: "create_prorations",
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
      }
    );

    user.userTier.plan = newPlan;
    user.userTier.status = "active";
    user.userTier.subscriptionCode = updatedSubscription.id;
    user.userTier.transactionId = updatedSubscription.latest_invoice as string;
    user.userTier.expiresAt = updatedSubscription.current_period_end
      ? new Date(updatedSubscription.current_period_end * 1000)
      : null;

    user.activeSubscription = {
      provider: "stripe",
      subscriptionId: updatedSubscription.id,
      expiryDate: user.userTier.expiresAt,
    };

    await user.save();

    return {
      message: "Stripe subscription updated",
      nextAction: "await_activation",
      data: {
        subscriptionId: updatedSubscription.id,
        currentPeriodEnd: updatedSubscription.current_period_end,
      },
    };
  }
}

export default StripeSubscriptionService;
