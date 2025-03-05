import mongoose from "mongoose";
// This schema will be used to collect transaction logs regardless of the payment gateway used including manual payment
const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    plan: { type: String, required: true },
    billingCycle: {
      type: String,
      enum: ["yearly, monthly"],
      required: true,
    },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true, unique: true },
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
    paidAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

const TransactionModel = mongoose.model("Transaction", TransactionSchema);
export default TransactionModel;
