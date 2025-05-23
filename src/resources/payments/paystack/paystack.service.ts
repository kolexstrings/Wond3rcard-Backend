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

      return {
        type: "subscription",
        subscriptionData: subscriptionResponse.data.data,
      };
    } else {
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

      return {
        type: "payment",
        checkoutUrl: transactionResponse.data.data.authorization_url,
        reference: transactionResponse.data.data.reference,
      };
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
    const profile = await profileModel.findById(userId);

    if (!user) throw new HttpException(404, "error", "User not found");

    // Prevent duplicate transactions
    const existingTransaction = await TransactionModel.findOne({
      transactionId: data.id,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    const transactionId = data.id;
    const subscriptionCode = data.subscription.code;
    const referenceId = generateTransactionId("subscription", "paystack");
    const paymentMethod = data.channel;
    const paidAt = new Date(data.paid_at);
    const expiresAt = new Date(
      paidAt.getTime() + durationInDays * 24 * 60 * 60 * 1000
    );

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

  public async cancelSubscription(userId: string) {
    const user = await userModel.findById(userId);
    if (!user || user.userTier.status !== "active")
      throw new HttpException(
        404,
        "error",
        "User not found or subscription inactive"
      );

    // Disable Paystack subscription if a subscriptionCode exists
    if (user.userTier.subscriptionCode) {
      await axios.post(
        `https://api.paystack.co/subscription/${user.userTier.subscriptionCode}/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Update the user's subscription locally
    user.userTier.status = "inactive";
    await user.save();

    // Notify user via email
    const profile = await profileModel.findById(userId);
    const template = MailTemplates.subscriptionCancelled;
    const emailData = {
      name: profile.firstname,
      plan: user.userTier.plan,
    };

    await this.mailer.sendMail(
      user.email,
      "Subscription Canceled",
      template,
      "Subscription",
      emailData
    );

    return { message: "Subscription canceled successfully" };
  }

  public async changeSubscription(
    userId: string,
    newPlan: UserTiers,
    newBillingCycle: "monthly" | "yearly"
  ) {
    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const newTier = await tierModel.findOne({ name: newPlan });
    if (!newTier)
      throw new HttpException(404, "error", "New subscription plan not found");

    const { price, durationInDays, planCode } =
      newTier.billingCycle[newBillingCycle];

    // Disable old Paystack subscription if exists
    if (user.userTier.subscriptionCode) {
      await axios.post(
        `https://api.paystack.co/subscription/${user.userTier.subscriptionCode}/disable`,
        {},
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    }

    await this.initializePayment(userId, newPlan, newBillingCycle);

    // Set new subscription data (active or inactive depending on your logic)
    user.userTier = {
      plan: newPlan,
      status: "inactive", // or 'active' depending on your intended workflow
      transactionId: "",
      subscriptionCode: "",
      expiresAt: new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000),
    };

    await user.save();

    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan: newPlan,
      billingCycle: newBillingCycle,
      amount: price,
      transactionType: "upgrade/downgrade",
      status: "success",
      paymentProvider: "paystack",
      paidAt: new Date(),
      expiresAt: new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000),
    });

    return { message: "Subscription plan updated successfully" };
  }
}

export default PaystackSubscriptionService;
