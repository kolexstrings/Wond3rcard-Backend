import { Document } from "mongoose";

export interface IFeatureFlag extends Document {
  name: string;
  enabled: boolean;
  description?: string;
  userTiers: string[];
  createdAt: Date;
  updatedAt: Date;
}
