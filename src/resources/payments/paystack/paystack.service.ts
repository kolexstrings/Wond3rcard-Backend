import axios from "axios";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import TransactionModel from "../transactions.model";
import MailTemplates from "../../mails/mail.templates";
import NodeMailerService from "../../mails/nodemailer.service";
import { generateTransactionId } from "../../../utils/generateTransactionId";
import { UserTiers } from "../../user/user.protocol";

type CancelSubscriptionParams = {
  targetUserId: string;
  subscriptionId: string;
};

type ChangeSubscriptionParams = {
  targetUserId: string;
  newPlan: UserTiers;
  billingCycle: "monthly" | "yearly";
};

class PaystackSubscriptionService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY;
  private baseUrl = "https://api.paystack.co";
  private mailer = new NodeMailerService();

  public async initializePayment(
    userId: string,
    plan: string,
    billingCycle: "monthly" | "yearly"
  ) {
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

      const user = await userModel.findById(userId);
      if (!user) {
        throw new HttpException(
          404,
          "user_not_found",
          "User account not found for payment initialization"
        );
      }

      const profile = await profileModel.findOne({ uid: userId });
      if (!profile) {
        throw new HttpException(
          404,
          "profile_not_found",
          "User profile not found. Please complete your profile first."
        );
      }

      const tier = await tierModel.findOne({ name: plan.toLowerCase() });
      if (!tier) {
        throw new HttpException(
          404,
          "tier_not_found",
          `Subscription tier '${plan}' not found. Available tiers: basic, premium, business`
        );
      }

      const { durationInDays, paystackPlanCode } =
        tier.billingCycle[billingCycle];

      if (!paystackPlanCode) {
        throw new HttpException(
          500,
          "payment_configuration_error",
          `Paystack PlanCode not configured for ${plan} ${billingCycle} tier. Please contact administrator.`
        );
      }

      let planDetails;
      try {
        const response = await axios.get(
          `${this.baseUrl}/plan/${paystackPlanCode}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );
        planDetails = response.data;
      } catch (error) {
        if (error.response?.status === 404) {
          throw new HttpException(
            500,
            "payment_configuration_error",
            "Paystack plan not found. Please contact administrator."
          );
        }
        if (error.response?.status === 401) {
          throw new HttpException(
            500,
            "payment_configuration_error",
            "Paystack authentication failed. Please contact administrator."
          );
        }
        throw new HttpException(
          503,
          "payment_gateway_unavailable",
          "Unable to connect to Paystack service. Please try again later."
        );
      }

      if (!planDetails.status || !planDetails.data) {
        throw new HttpException(
          500,
          "payment_gateway_error",
          "Invalid response from Paystack plan service"
        );
      }

      const amount = planDetails.data.amount;

      // Ensure customer exists
      let customerCode = user.paystackCustomerId;

      if (!customerCode) {
        try {
          const customerResponse = await axios.post(
            `${this.baseUrl}/customer`,
            {
              email: user.email,
              first_name: profile.firstname,
              last_name: profile.lastname,
            },
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
            }
          );

          if (!customerResponse.data.status) {
            throw new HttpException(
              500,
              "customer_creation_failed",
              "Failed to create customer account with Paystack"
            );
          }

          customerCode = customerResponse.data.data.customer_code;
          user.paystackCustomerId = customerCode;
          await user.save();
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          throw new HttpException(
            500,
            "customer_creation_failed",
            "Failed to create Paystack customer account"
          );
        }
      }

      // Fetch customer's authorization history
      let customerDetails;
      try {
        const response = await axios.get(
          `${this.baseUrl}/customer/${customerCode}`,
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );
        customerDetails = response.data;
      } catch (error) {
        throw new HttpException(
          503,
          "payment_gateway_unavailable",
          "Unable to fetch customer details from Paystack"
        );
      }

      const authorizations = customerDetails.data.data.authorizations;
      const savedAuthorization = authorizations?.[0]?.authorization_code;

      if (savedAuthorization) {
        // User already has a saved card: Create subscription directly
        try {
          const subscriptionResponse = await axios.post(
            `${this.baseUrl}/subscription`,
            {
              customer: customerCode,
              plan: paystackPlanCode,
              authorization: savedAuthorization,
              callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
              metadata: {
                userId,
                plan,
                billingCycle,
                durationInDays,
                amount,
                transactionType: "subscription",
              },
            },
            {
              headers: { Authorization: `Bearer ${this.secretKey}` },
            }
          );

          if (!subscriptionResponse.data.status) {
            throw new HttpException(
              500,
              "subscription_creation_failed",
              "Failed to create subscription with saved card"
            );
          }

          // Update callback URL with reference after getting response
          subscriptionResponse.data.data.callback_url = `${process.env.FRONTEND_BASE_URL}/payment-success?reference=${subscriptionResponse.data.data.reference}`;

          return {
            type: "subscription" as const,
            subscriptionData: subscriptionResponse.data.data,
          };
        } catch (error) {
          if (error instanceof HttpException) {
            throw error;
          }
          throw new HttpException(
            500,
            "subscription_creation_failed",
            "Failed to create subscription with saved payment method"
          );
        }
      }

      // No saved authorization: Initialize payment
      try {
        const transactionResponse = await axios.post(
          `${this.baseUrl}/transaction/initialize`,
          {
            email: user.email,
            amount: amount,
            callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
            metadata: {
              userId,
              plan,
              billingCycle,
              durationInDays,
              amount,
              transactionType: "subscription",
            },
          },
          {
            headers: { Authorization: `Bearer ${this.secretKey}` },
          }
        );

        if (!transactionResponse.data.status) {
          throw new HttpException(
            500,
            "payment_initialization_failed",
            "Failed to initialize payment with Paystack"
          );
        }

        // Update callback URL with reference after getting response
        transactionResponse.data.data.callback_url = `${process.env.FRONTEND_BASE_URL}/payment-success?reference=${transactionResponse.data.data.reference}`;

        return {
          type: "payment" as const,
          checkoutUrl: transactionResponse.data.data.authorization_url,
          reference: transactionResponse.data.data.reference,
        };
      } catch (error) {
        if (error instanceof HttpException) {
          throw error;
        }
        throw new HttpException(
          500,
          "payment_initialization_failed",
          "Failed to initialize payment. Please try again or use a different payment method."
        );
      }
    } catch (error) {
      console.error("Error in Paystack initializePayment:", error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        500,
        "payment_initialization_failed",
        "An unexpected error occurred while initializing payment. Please try again or contact support."
      );
    }
  }

  private async disablePaystackSubscription(
    subscriptionCode: string
  ): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/subscription/${subscriptionCode}/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Unable to disable Paystack subscription";
      throw new HttpException(502, "error", message);
    }
  }

  public async verifyTransaction(reference: string) {
    const response = await axios.get(
      `${this.baseUrl}/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
  }

  public async handleSuccessfulSubscription(data: any) {
    const { userId, plan, billingCycle, durationInDays, amount } =
      data.metadata;

    const user = await userModel.findById(userId);
    const profile =
      (await profileModel.findOne({ uid: userId })) ||
      (await profileModel.findById(userId));

    if (!user) throw new HttpException(404, "error", "User not found");

    // Prevent duplicate transactions
    const existingTransaction = await TransactionModel.findOne({
      transactionId: data.id,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    const transactionId = data.id;
    const referenceId = generateTransactionId("subscription", "paystack");
    const paymentMethod = data.channel;
    const paidAt = new Date(data.paid_at);
    const expiresAt = new Date(
      paidAt.getTime() + durationInDays * 24 * 60 * 60 * 1000
    );

    let subscriptionCode = data.subscription?.subscription_code;

    if (data.authorization?.authorization_code) {
      const tier = await tierModel.findOne({ name: plan.toLowerCase() });
      const paystackPlanCode = tier.billingCycle[billingCycle].paystackPlanCode;

      const subscriptionResponse = await axios.post(
        `${this.baseUrl}/subscription`,
        {
          customer: data.customer.customer_code,
          plan: paystackPlanCode,
          authorization: data.authorization.authorization_code,
          callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success?reference=${data.reference}`,
          metadata: {
            userId,
            plan,
            billingCycle,
            durationInDays,
            amount,
            transactionType: "subscription",
          },
        },
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        }
      );

      subscriptionCode = subscriptionResponse.data.data.subscription_code;
    }

    // Update user subscription
    user.userTier = {
      plan,
      status: "active",
      transactionId,
      subscriptionCode,
      expiresAt,
    };

    await user.save();

    // Save transaction log
    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan,
      billingCycle,
      amount,
      referenceId,
      transactionId,
      transactionType: "subscription",
      subscriptionCode,
      status: "success",
      paymentProvider: "paystack",
      paymentMethod,
      paidAt,
      expiresAt,
    });

    const template = MailTemplates.subscriptionConfirmation;
    const email = user.email;
    const emailData = {
      name: profile.firstname,
      plan: plan,
      expiresAt: new Date(
        Date.now() + durationInDays * 24 * 60 * 60 * 1000
      ).toDateString(),
    };

    await this.mailer.sendMail(
      email,
      "Subscription Successful",
      template,
      "Subscription",
      emailData
    );

    return { message: "Subscription activated" };
  }

  public async cancelSubscription({
    targetUserId,
    subscriptionId,
  }: CancelSubscriptionParams) {
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
        "User does not have an active Paystack subscription"
      );
    }

    if (subscriptionId && subscriptionId !== activeSubscriptionCode) {
      throw new HttpException(
        400,
        "error",
        "Provided subscription ID does not match the active subscription"
      );
    }

    await this.disablePaystackSubscription(activeSubscriptionCode);

    user.userTier.status = "inactive";
    user.userTier.subscriptionCode = null;
    user.userTier.transactionId = null;
    user.userTier.expiresAt = null;

    if (user.activeSubscription?.provider === "paystack") {
      user.activeSubscription.provider = null;
      user.activeSubscription.subscriptionId = null;
      user.activeSubscription.expiryDate = null;
    }

    await user.save();

    const profile =
      (await profileModel.findOne({ uid: targetUserId })) ||
      (await profileModel.findById(targetUserId));

    if (profile) {
      const template = MailTemplates.subscriptionCancelled;
      const emailData = {
        name: profile.firstname,
        plan: user.userTier.plan,
      };

      await this.mailer.sendMail(
        user.email,
        "Subscription Cancelled",
        template,
        "Subscription",
        emailData
      );
    }

    return {
      message: "Subscription canceled successfully",
      subscriptionId: activeSubscriptionCode,
    };
  }

  public async changeSubscription({
    targetUserId,
    newPlan,
    billingCycle,
  }: ChangeSubscriptionParams) {
    const user = await userModel.findById(targetUserId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const normalizedPlan = newPlan.toLowerCase();
    const newTier = await tierModel.findOne({ name: normalizedPlan });
    if (!newTier)
      throw new HttpException(404, "error", "New subscription plan not found");

    const activeSubscriptionCode =
      user.userTier.subscriptionCode ||
      user.activeSubscription?.subscriptionId ||
      null;

    if (activeSubscriptionCode) {
      await this.disablePaystackSubscription(activeSubscriptionCode);
    }

    const initializationResult = await this.initializePayment(
      targetUserId,
      normalizedPlan,
      billingCycle
    );

    user.userTier.plan = newPlan;
    user.userTier.status = "inactive";
    user.userTier.transactionId = null;
    user.userTier.subscriptionCode =
      initializationResult.type === "subscription"
        ? initializationResult.subscriptionData.subscription_code
        : null;
    user.userTier.expiresAt = null;

    user.activeSubscription = {
      provider: "paystack",
      subscriptionId: user.userTier.subscriptionCode,
      expiryDate: null,
    };

    await user.save();

    return {
      message: "Subscription change initiated",
      nextAction:
        initializationResult.type === "payment"
          ? "complete_payment"
          : "await_activation",
      data: initializationResult,
    };
  }
}

export default PaystackSubscriptionService;
