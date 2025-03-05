import userModel from "../../user/user.model";
import { UserTiers } from "../../user/user.protocol";
import TransactionModel from "../transactions.model";

class ManualPaymentService {
  public async createManualPayment({
    userId,
    amount,
    plan,
    billingCycle,
    paymentMethod,
  }: {
    userId: string;
    amount: number;
    plan: UserTiers;
    billingCycle: string;
    paymentMethod: string;
  }) {
    const user = await userModel.findById(userId);
    if (!user) throw new Error("User not found");

    // Generate transaction & reference IDs
    const transactionId = `manual-${Date.now().toString().slice(-6)}`;
    const referenceId = transactionId;

    // Update user subscription (default 30 days)
    user.userTier = {
      plan,
      status: "active",
      transactionId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
    await user.save();

    // Store transaction details
    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan,
      billingCycle,
      amount,
      transactionId,
      referenceId,
      paymentProvider: "manual",
      status: "success",
      paymentMethod,
      paidAt: new Date(),
      expiresAt: user.userTier.expiresAt,
    });

    return { transactionId, message: "Manual payment recorded successfully" };
  }
}

export default ManualPaymentService;
