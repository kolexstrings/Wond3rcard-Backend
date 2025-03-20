import axios from "axios";
import HttpException from "../../../exceptions/http.exception";
import tierModel from "../../admin/subscriptionTier/tier.model";
import userModel from "../../user/user.model";
import TransactionModel from "../transactions.model";

class PaystackService {
  private secretKey = process.env.PAYSTACK_SECRET_KEY;
  private baseUrl = "https://api.paystack.co";

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

  generateTransactionId = (provider: "paystack" | "stripe" | "manual") => {
    const uniquePart = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    return `${provider}-${uniquePart}`;
  };

  public async handleSuccessfulPayment(data: any) {
    const { userId, plan, billingCycle, durationInDays } = data.metadata;

    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    // Prevent duplicate transactions
    const existingTransaction = await TransactionModel.findOne({
      transactionId: data.id,
    });
    if (existingTransaction) {
      return { message: "Transaction already processed" };
    }

    const transactionId = data.id;
    const referenceId = this.generateTransactionId("paystack");
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
      status: "success",
      paymentProvider: "paystack",
      paymentMethod,
      paidAt,
      expiresAt,
    });

    return { message: "Subscription activated" };
  }
}

export default PaystackService;
