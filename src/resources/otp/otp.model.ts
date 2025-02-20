import { model, Schema } from "mongoose";
import { OTP } from "./otp.protocol";

const OTPSchema = new Schema({
  userId: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
  isVerified: { type: Boolean, default: false },
},
  {
    timestamps: true
  },
)

export default model<OTP>('OTP', OTPSchema)