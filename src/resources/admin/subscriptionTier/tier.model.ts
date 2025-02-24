import mongoose, { Schema, Document } from "mongoose";

export interface ITier extends Document {
  name: string;
}

const TierSchema = new Schema<ITier>({
  name: { type: String, required: true, unique: true },
});

export default mongoose.model<ITier>("Tier", TierSchema);
