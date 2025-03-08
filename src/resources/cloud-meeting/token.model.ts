import mongoose, { Schema, Document, Types } from "mongoose";

interface Token extends Document {
  userId: string;
  service: "zoom" | "google_meet" | "microsoft_teams";
  accessToken: string;
  refreshToken: string;
  tokenExpiry: Date;
}

const TokenSchema = new Schema<Token>({
  userId: Types.ObjectId,
  service: {
    type: String,
    enum: ["zoom", "google_meet", "microsoft_teams"],
    required: true,
  },
  accessToken: { type: String, required: true },
  refreshToken: { type: String, required: true },
  tokenExpiry: { type: Date, required: true },
});

export default mongoose.model<Token>("Token", TokenSchema);
