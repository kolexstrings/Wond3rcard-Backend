import { model, Schema } from "mongoose";
import { Profile } from "./profile.protocol";
import { UserTiers } from "../user/user.protocol";

const profileShema = new Schema<Profile>(
  {
    uid: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    firstname: { type: String, required: true },
    othername: { type: String, required: false, default: "" },
    lastname: { type: String, required: true },
    mobileNumber: { type: String, required: false, default: "" },
    email: { type: String, required: false, default: "" },
    companyName: { type: String, required: false, default: "" },
    designation: { type: String, required: false, default: "" },
    profileUrl: { type: String, required: false, default: "" },
    coverUrl: { type: String, required: false, default: "" },
    contacts: [{ type: Schema.Types.ObjectId, ref: "Profile" }],
    connections: [{ type: Schema.Types.ObjectId, ref: "Profile" }],
    plan: {
      type: String,
      enum: Object.values(UserTiers),
      default: UserTiers.Basic,
    },
  },
  {
    timestamps: true,
  }
);

export default model<Profile>("Profile", profileShema);
