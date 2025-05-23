import { model, Schema } from "mongoose";
import { MediaType, SocialMedia } from "./social-media.protocol";

const socialMediaSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String, unique: false, default: "" },
    mediaType: {
      type: String,
      enum: Object.values(MediaType),
      default: MediaType.Social,
    },
  },
  {
    timestamps: true,
  }
);

export default model<SocialMedia>("SocialMedia", socialMediaSchema);
