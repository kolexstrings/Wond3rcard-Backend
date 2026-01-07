import stripe from "../../../config/stripe";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import MailTemplates from "../../mails/mail.templates";
import NodeMailerService from "../../mails/nodemailer.service";
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
  private mailer = new NodeMailerService();

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
    try {
      // Validate input parameters
      if (!userId || !plan || !billingCycle) {
        throw new HttpException(
          400,
          "invalid_request",
          "Missing required parameters: userId, plan, and billingCycle are required"
        );
      }

      if (!["monthly", "yearly"].includes(billingCycle)) {
        throw new HttpException(
          400,
          "invalid_billing_cycle",
          "Invalid billing cycle. Must be either 'monthly' or 'yearly'"
        );
      }

      const tier = await tierModel.findOne({ name: plan }).lean();
      if (!tier) {
        throw new HttpException(
          404,
          "tier_not_found",
          `Subscription tier '${plan}' not found. Available tiers: basic, premium, business`
        );
      }

      const selectedBilling =
        billingCycle === "yearly"
          ? tier.billingCycle.yearly
          : tier.billingCycle.monthly;

      const stripePlanCode = selectedBilling.stripePlanCode;
      if (!stripePlanCode) {
        throw new HttpException(
          500,
          "payment_configuration_error",
          `Stripe PlanCode not configured for ${plan} ${billingCycle} tier. Please contact administrator.`
        );
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: stripePlanCode,
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
          "payment_gateway_error",
          "Stripe did not return a checkout URL. The payment gateway may be temporarily unavailable."
        );
      }

      return { type: "checkout", url: session.url };
    } catch (error) {
      // Handle Stripe-specific errors
      if (error.type === "StripeCardError") {
        throw new HttpException(
          400,
          "card_error",
          `Card payment failed: ${error.message}`
        );
      }

      if (error.type === "StripeRateLimitError") {
        throw new HttpException(
          429,
          "rate_limit_exceeded",
          "Too many requests to Stripe. Please try again in a few moments."
        );
      }

      if (error.type === "StripeInvalidRequestError") {
        throw new HttpException(
          400,
          "invalid_request",
          `Invalid request to Stripe: ${error.message}`
        );
      }

      if (error.type === "StripeAPIError") {
        throw new HttpException(
          502,
          "payment_gateway_error",
          "Stripe API is temporarily unavailable. Please try again later."
        );
      }

      if (error.type === "StripeConnectionError") {
        throw new HttpException(
          503,
          "payment_gateway_unavailable",
          "Unable to connect to Stripe payment service. Please check your internet connection and try again."
        );
      }

      if (error.type === "StripeAuthenticationError") {
        throw new HttpException(
          500,
          "payment_configuration_error",
          "Stripe authentication failed. Please contact administrator."
        );
      }

      // Re-throw our HttpExceptions
      if (error instanceof HttpException) {
        throw error;
      }

      // Handle any other unexpected errors
      console.error("Unexpected error in Stripe createCheckoutSession:", error);
      throw new HttpException(
        500,
        "internal_server_error",
        "An unexpected error occurred while creating payment session. Please try again or contact support if the problem persists."
      );
    }
  }

  public async handleSuccessfulSubscription(session: any) {
    try {
      const { userId, plan, billingCycle } = session.metadata;

      // Validate required metadata
      if (!userId || !plan || !billingCycle) {
        console.error(
          "Missing required metadata in Stripe webhook:",
          session.metadata
        );
        throw new HttpException(
          400,
          "invalid_webhook_data",
          "Missing required metadata in webhook payload"
        );
      }

      const user = await userModel.findById(userId);
      if (!user) {
        console.error(`User not found for ID: ${userId}`);
        throw new HttpException(
          404,
          "user_not_found",
          `User account not found for subscription activation`
        );
      }

      // Check for duplicate processing
      const existingTransaction = await TransactionModel.findOne({
        transactionId: session.id,
      });
      if (existingTransaction) {
        console.log(`Transaction ${session.id} already processed, skipping`);
        return { received: true, message: "Transaction already processed" };
      }

      const transactionId = session.id; // Stripe's unique ID
      const subscriptionCode = session.subscription; // Extract the subscription ID
      const referenceId = generateTransactionId("subscription", "stripe"); // Custom transaction ID
      const paymentMethod = session.payment_method_types?.[0] || "unknown";
      const paidAt = new Date(session.created * 1000); // Stripe timestamps in seconds

      // Validate subscription data
      if (!subscriptionCode) {
        throw new HttpException(
          400,
          "missing_subscription_data",
          "No subscription ID found in Stripe session"
        );
      }

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionCode
      );
      const expiresAt = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null;

      // Update user subscription
      user.userTier = {
        plan,
        status: "active",
        transactionId,
        subscriptionCode,
        expiresAt,
      };

      user.activeSubscription = {
        provider: "stripe",
        subscriptionId: subscriptionCode,
        expiryDate: expiresAt,
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
        expiresAt,
      });

      const profile =
        (await profileModel.findOne({ uid: userId })) ||
        (await profileModel.findById(userId));
      const dashboardBase =
        process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") ||
        "https://dashboard.wond3rcard.com";
      const formattedAmount = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: session.currency?.toUpperCase() || "USD",
      }).format(session.amount_total / 100);
      const emailData = {
        name: profile?.firstname || user.username,
        plan: plan.charAt(0).toUpperCase() + plan.slice(1),
        billingCycle:
          billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1),
        startDate: paidAt.toDateString(),
        expiresAt: user.userTier.expiresAt?.toDateString() || "N/A",
        paymentMethod:
          paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1),
        amount: formattedAmount,
        dashboardLink: `${dashboardBase}`,
      };

      await this.mailer.sendMail(
        user.email,
        "Subscription Confirmed - WOND3R CARD",
        MailTemplates.subscriptionConfirmation,
        "Subscription",
        emailData
      );

      console.log(
        `Successfully activated subscription for user ${userId}, plan ${plan}`
      );
      return { received: true };
    } catch (error) {
      console.error("Error handling successful Stripe subscription:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        "subscription_activation_failed",
        "Failed to activate subscription. Please contact support with your transaction ID."
      );
    }
  }

  public async cancelSubscription({
    targetUserId,
    subscriptionId,
  }: StripeCancelSubscriptionParams) {
    try {
      if (!targetUserId) {
        throw new HttpException(
          400,
          "invalid_request",
          "Missing required parameter: targetUserId"
        );
      }

      const user = await userModel.findById(targetUserId);
      if (!user) {
        throw new HttpException(
          404,
          "user_not_found",
          "User account not found for subscription cancellation"
        );
      }

      const activeSubscriptionCode =
        user.userTier.subscriptionCode ||
        user.activeSubscription?.subscriptionId ||
        null;

      if (!activeSubscriptionCode || user.userTier.status !== "active") {
        throw new HttpException(
          400,
          "no_active_subscription",
          "You do not have an active subscription to cancel"
        );
      }

      const resolvedSubscriptionId =
        subscriptionId && subscriptionId.trim().length > 0
          ? subscriptionId
          : activeSubscriptionCode;

      if (
        subscriptionId &&
        subscriptionId.trim().length > 0 &&
        subscriptionId !== activeSubscriptionCode
      ) {
        throw new HttpException(
          400,
          "subscription_mismatch",
          "The provided subscription ID does not match your active subscription"
        );
      }

      try {
        await stripe.subscriptions.update(resolvedSubscriptionId, {
          cancel_at_period_end: true,
        });
      } catch (stripeError) {
        if (stripeError.type === "StripeInvalidRequestError") {
          throw new HttpException(
            400,
            "invalid_subscription",
            "Subscription not found or already cancelled in Stripe"
          );
        }
        throw stripeError;
      }

      // Update user subscription status
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

      const profile =
        (await profileModel.findOne({ uid: targetUserId })) ||
        (await profileModel.findById(targetUserId));
      const dashboardBase =
        process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") ||
        "https://dashboard.wond3rcard.com";
      const stripeSubscription = await stripe.subscriptions.retrieve(
        resolvedSubscriptionId
      );
      const accessUntilDate = stripeSubscription.current_period_end
        ? new Date(stripeSubscription.current_period_end * 1000).toDateString()
        : "End of billing period";
      const planName = user.userTier.plan || "Premium";
      const emailData = {
        name: profile?.firstname || user.username,
        plan: planName.charAt(0).toUpperCase() + planName.slice(1),
        cancelledDate: new Date().toDateString(),
        accessUntil: accessUntilDate,
        dashboardLink: `${dashboardBase}`,
      };

      await this.mailer.sendMail(
        user.email,
        "Subscription Cancelled - WOND3R CARD",
        MailTemplates.subscriptionCancelled,
        "Subscription",
        emailData
      );

      console.log(
        `Successfully cancelled subscription for user ${targetUserId}`
      );
      return {
        message:
          "Subscription cancellation scheduled. You will continue to have access until the end of your current billing period.",
        subscriptionId: resolvedSubscriptionId,
      };
    } catch (error) {
      console.error("Error cancelling Stripe subscription:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        "cancellation_failed",
        "Failed to cancel subscription. Please try again or contact support."
      );
    }
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

    const newPriceId = tier.billingCycle[billingCycle].stripePlanCode;
    if (!newPriceId)
      throw new HttpException(
        500,
        "error",
        "Stripe PlanCode not configured for requested tier"
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

    const profile =
      (await profileModel.findOne({ uid: targetUserId })) ||
      (await profileModel.findById(targetUserId));
    const dashboardBase =
      process.env.FRONTEND_BASE_URL?.replace(/\/$/, "") ||
      "https://dashboard.wond3rcard.com";
    const emailData = {
      name: profile?.firstname || user.username,
      plan: newPlan,
      expiresAt: user.userTier.expiresAt
        ? user.userTier.expiresAt.toDateString()
        : "N/A",
      dashboardLink: `${dashboardBase}`,
    };

    await this.mailer.sendMail(
      user.email,
      "Subscription Updated",
      MailTemplates.subscriptionConfirmation,
      "Subscription",
      emailData
    );

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
