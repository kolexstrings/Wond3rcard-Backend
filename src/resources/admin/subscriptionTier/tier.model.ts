import mongoose, { Schema, Document } from "mongoose";

export interface ITier extends Document {
  name: string;
  billingCycle: {
    monthly: { price: number; durationInDays: number };
    yearly: { price: number; durationInDays: number };
  };
  description: string;
  trialPeriod: number;
  autoRenew: boolean;
  features: string[];
}

const BillingCycleSchema = new Schema({
  monthly: {
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true, default: 30 },
  },
  yearly: {
    price: { type: Number, required: true },
    durationInDays: { type: Number, required: true, default: 365 },
  },
});

const TierSchema = new Schema<ITier>(
  {
    name: { type: String, required: true, unique: true },
    billingCycle: { type: BillingCycleSchema, required: true },
    description: { type: String, required: true },
    trialPeriod: { type: Number, required: true },
    autoRenew: { type: Boolean, required: true },
    features: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITier>("Tier", TierSchema);
