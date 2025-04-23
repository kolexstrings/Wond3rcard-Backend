import mongoose from "mongoose";
import { ITransaction, TransactionType } from "./transactions.protocol";

const TransactionSchema = new mongoose.Schema<ITransaction>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    plan: { type: String },
    billingCycle: { type: String, enum: ["monthly", "yearly"] },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: false, unique: true },
    referenceId: { type: String, required: true },
    status: {
      type: String,
      enum: ["success", "pending", "failed"],
      required: true,
    },
    paymentProvider: {
      type: String,
      enum: ["paystack", "stripe", "manual"],
      required: true,
    },
    paymentMethod: { type: String },
    expiresAt: { type: Date },
    transactionType: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
    },
    subscriptionCode: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const TransactionModel = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);
export default TransactionModel;
