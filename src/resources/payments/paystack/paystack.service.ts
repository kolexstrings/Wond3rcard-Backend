import axios from "axios";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import profileModel from "../../profile/profile.model";
import TransactionModel from "../transactions.model";
import MailTemplates from "../../mails/mail.templates";
import NodeMailerService from "../../mails/nodemailer.service";
import { generateTransactionId } from "../../../utils/generateTransactionId";

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
    const tier = await tierModel.findOne({ name: plan.toLowerCase() });
    if (!tier) throw new Error("Invalid subscription tier");

    const { price, durationInDays } = tier.billingCycle[billingCycle];

    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      {
        email: user.email,
        amount: price * 100, // Convert to kobo
        callback_url: `${process.env.FRONTEND_BASE_URL}/payment-success`,
        metadata: {
          userId,
          plan,
          billingCycle,
          durationInDays,
          transactionType: "subscription",
        },
      },
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      }
    );

    return response.data;
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
    const { userId, plan, billingCycle, durationInDays } = data.metadata;

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
    const referenceId = generateTransactionId("subscription", "paystack");
    const amount = data.amount / 100;
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
      transactionId,
      referenceId,
      transactionType: "subscription",
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
}

export default PaystackSubscriptionService;
