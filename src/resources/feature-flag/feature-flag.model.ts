// featureFlag.model.ts
import { Schema, model } from "mongoose";
import { IFeatureFlag } from "./feature-flags.protocol";

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    name: { type: String, required: true, unique: true },
    enabled: { type: Boolean, required: true, default: false },
    description: { type: String },
    userTiers: {
      type: [String],
      required: true,
      default: ["basic", "premium", "business"],
    },
  },
  {
    timestamps: true,
  }
);

export const featureFlagModel = model<IFeatureFlag>(
  "FeatureFlag",
  featureFlagSchema
);
