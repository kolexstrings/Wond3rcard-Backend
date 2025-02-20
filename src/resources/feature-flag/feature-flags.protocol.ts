// featureFlag.interface.ts
import { Document } from "mongoose";

export interface IFeatureFlag extends Document {
  name: string;
  enabled: boolean;
  description?: string;
  userRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}
