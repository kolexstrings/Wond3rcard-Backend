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
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    const profile = await profileModel.findOne({ uid: userId });
    if (!profile) throw new Error("User profile not found");

    const tier = await tierModel.findOne({ name: plan.toLowerCase() });
    if (!tier) throw new Error("Invalid subscription tier");

    const { durationInDays, planCode } = tier.billingCycle[billingCycle];

    const planDetails = await axios.get(`${this.baseUrl}/plan/${planCode}`, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });

    const amount = planDetails.data.data.amount;

    // Ensure customer exists
    let customerCode = user.paystackCustomerId;

    if (!customerCode) {
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

      customerCode = customerResponse.data.data.customer_code;

      user.paystackCustomerId = customerCode;
      await user.save();
    }

    // Fetch customer's authorization history
    const customerDetails = await axios.get(
      `${this.baseUrl}/customer/${customerCode}`,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    const authorizations = customerDetails.data.data.authorizations;
    const savedAuthorization = authorizations?.[0]?.authorization_code;

    if (savedAuthorization) {
      // User already has a saved card: Create subscription directly
      const subscriptionResponse = await axios.post(
        `${this.baseUrl}/subscription`,
        {
          customer: customerCode,
          plan: planCode,
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

      // Update callback URL with reference after getting response
      subscriptionResponse.data.data.callback_url = `${process.env.FRONTEND_BASE_URL}/payment-success?reference=${subscriptionResponse.data.data.reference}`;

      return {
        type: "subscription" as const,
        subscriptionData: subscriptionResponse.data.data,
      };
    }

    // No saved authorization: Initialize payment
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

    // Update callback URL with reference after getting response
    transactionResponse.data.data.callback_url = `${process.env.FRONTEND_BASE_URL}/payment-success?reference=${transactionResponse.data.data.reference}`;

    return {
      type: "payment" as const,
      checkoutUrl: transactionResponse.data.data.authorization_url,
      reference: transactionResponse.data.data.reference,
    };
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
      const planCode = tier.billingCycle[billingCycle].planCode;

      const subscriptionResponse = await axios.post(
        `${this.baseUrl}/subscription`,
        {
          customer: data.customer.customer_code,
          plan: planCode,
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
