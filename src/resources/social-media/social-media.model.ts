import { model, Schema } from "mongoose";
import { MediaType, SocialMedia } from "./social-media.protocol";

const socialMedialSchema = new Schema({
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, unique: false, default: '' },
  link: { type: String, unique: false, default: '' },
  description: { type: String, unique: false, default: '' },
  mediaType: { type: String, enum: Object.values(MediaType), default: MediaType.Communication },

},
  {
    timestamps: true
  },
)


export default model<SocialMedia>('SocialMedia', socialMedialSchema)