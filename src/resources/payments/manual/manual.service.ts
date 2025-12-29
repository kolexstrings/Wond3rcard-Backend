import HttpException from "../../../exceptions/http.exception";
import userModel from "../../user/user.model";
import { UserTiers } from "../../user/user.protocol";
import TransactionModel from "../transactions.model";
import { generateTransactionId } from "../../../utils/generateTransactionId";

type ManualBillingCycle = "monthly" | "yearly";

type ManualPaymentPayload = {
  userId: string;
  amount: number;
  plan: UserTiers;
  billingCycle: ManualBillingCycle;
  paymentMethod: string;
  durationInDays?: number;
};

type ManualChangePayload = {
  userId: string;
  newPlan: UserTiers;
  billingCycle: ManualBillingCycle;
  amount?: number;
  paymentMethod?: string;
  durationInDays?: number;
};

class ManualPaymentService {
  private getDurationInDays(
    billingCycle: ManualBillingCycle,
    override?: number
  ): number {
    if (override && override > 0) {
      return override;
    }

    return billingCycle === "yearly" ? 365 : 30;
  }

  private computeExpiry(durationInDays: number): Date {
    return new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);
  }

  public async createManualPayment(payload: ManualPaymentPayload) {
    const {
      userId,
      amount,
      plan,
      billingCycle,
      paymentMethod,
      durationInDays,
    } = payload;

    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const resolvedDuration = this.getDurationInDays(
      billingCycle,
      durationInDays
    );
    const expiresAt = this.computeExpiry(resolvedDuration);

    const transactionId = generateTransactionId("subscription", "manual");
    const referenceId = transactionId;

    user.userTier = {
      plan,
      status: "active",
      transactionId,
      subscriptionCode: "manual",
      expiresAt,
    };
    user.activeSubscription = {
      provider: "manual",
      subscriptionId: "manual",
      expiryDate: expiresAt,
    };
    await user.save();

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
      paymentProvider: "manual",
      status: "success",
      paymentMethod,
      paidAt: new Date(),
      expiresAt,
    });

    return { transactionId, message: "Manual payment recorded successfully" };
  }

  public async cancelManualSubscription(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    if (
      user.userTier.status !== "active" ||
      user.activeSubscription?.provider !== "manual"
    ) {
      throw new HttpException(
        400,
        "error",
        "User does not have an active manual subscription"
      );
    }

    user.userTier.status = "inactive";
    user.userTier.subscriptionCode = null;
    user.userTier.transactionId = null;
    user.userTier.expiresAt = null;

    if (user.activeSubscription) {
      user.activeSubscription.provider = null;
      user.activeSubscription.subscriptionId = null;
      user.activeSubscription.expiryDate = null;
    }

    await user.save();

    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan: user.userTier.plan,
      billingCycle: user.userTier.status === "inactive" ? "manual" : "manual",
      amount: 0,
      transactionId: generateTransactionId("subscription", "manual"),
      referenceId: null,
      transactionType: "manual_cancellation",
      paymentProvider: "manual",
      status: "success",
      paymentMethod: "manual",
      paidAt: new Date(),
      expiresAt: null,
    });

    return { message: "Manual subscription cancelled" };
  }

  public async changeManualSubscription(payload: ManualChangePayload) {
    const {
      userId,
      newPlan,
      billingCycle,
      amount = 0,
      paymentMethod = "manual",
      durationInDays,
    } = payload;

    const user = await userModel.findById(userId);
    if (!user) throw new HttpException(404, "error", "User not found");

    const resolvedDuration = this.getDurationInDays(
      billingCycle,
      durationInDays
    );
    const expiresAt = this.computeExpiry(resolvedDuration);
    const transactionId = generateTransactionId("subscription", "manual");

    user.userTier = {
      plan: newPlan,
      status: "active",
      transactionId,
      subscriptionCode: "manual",
      expiresAt,
    };
    user.activeSubscription = {
      provider: "manual",
      subscriptionId: "manual",
      expiryDate: expiresAt,
    };

    await user.save();

    await TransactionModel.create({
      userId,
      userName: user.username,
      email: user.email,
      plan: newPlan,
      billingCycle,
      amount,
      transactionId,
      referenceId: transactionId,
      transactionType: "manual_change",
      paymentProvider: "manual",
      status: "success",
      paymentMethod,
      paidAt: new Date(),
      expiresAt,
    });

    return {
      message: "Manual subscription updated",
      subscription: {
        plan: newPlan,
        expiresAt,
        billingCycle,
      },
    };
  }
}

export default ManualPaymentService;
