import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import { User, UserRole, UserStatus, UserTiers } from "./user.protocol";

const UserSchema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fcmToken: { type: String, require: true, unique: false },
    userRole: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.Customer,
    },
    is2FAEnabled: { type: Boolean, required: true, default: false },
    mfaEnabled: { type: Boolean, required: true, default: false },
    mfaSecret: { type: String, required: false },
    userStatus: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.Active,
    },
    isSoftDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    userTier: {
      type: String,
      enum: Object.values(UserTiers),
      required: true,
      default: UserTiers.Basic,
    },
    refreshToken: { type: String, default: "" },
    organizations: { type: [], required: false },
    stripeCustomerId: { type: String, default: null },
    paystackCustomerId: { type: String, default: null },
    activeSubscription: {
      provider: { type: String, enum: ["stripe", "paystack"], default: null },
      subscriptionId: { type: String, default: null },
      expiryDate: { type: Date, default: null },
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre<User>("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});

UserSchema.methods.isValidPassword = async function (
  password: string
): Promise<Error | boolean> {
  return await bcrypt.compare(password, this.password);
};

export default model<User>("User", UserSchema);
