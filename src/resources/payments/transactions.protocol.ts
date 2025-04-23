import mongoose, { Document } from "mongoose";

export enum TransactionType {
  Subscription = "subscription",
  CardOrder = "card_order",
}

export interface ITransaction extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  userName: string;
  email: string;
  plan?: string; // Only for subscriptions
  billingCycle?: "monthly" | "yearly"; // Only for subscriptions
  amount: number;
  transactionId: string;
  referenceId: string;
  transactionType: TransactionType;
  subscriptionCode: string;
  status: "success" | "pending" | "failed";
  paymentProvider: "paystack" | "stripe" | "manual";
  paymentMethod?: string;
  paidAt: Date;
  expiresAt?: Date;
}
