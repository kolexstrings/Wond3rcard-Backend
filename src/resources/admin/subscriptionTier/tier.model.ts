import mongoose, { Schema, Document } from "mongoose";

export interface ITier extends Document {
  name: string;
  billingCycle: {
    monthlyPrice: number;
    yearlyPrice: number;
  };
  description: string;
  trialPeriod: number;
  autoRenew: boolean;
  features: string[];
}

const TierSchema = new Schema<ITier>(
  {
    name: { type: String, required: true, unique: true },
    billingCycle: {
      monthlyPrice: { type: Number, required: true },
      yearlyPrice: { type: Number, required: true },
    },
    description: { type: String, required: true },
    trialPeriod: { type: Number, required: true },
    autoRenew: { type: Boolean, required: true },
    features: { type: [String], required: true },
  },
  { timestamps: true }
);

export default mongoose.model<ITier>("Tier", TierSchema);
