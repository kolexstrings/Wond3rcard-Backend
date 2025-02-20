import { Document } from "mongoose";
import { OrganizationMember } from "../organization/organization.protocol";

enum UserStatus {
  Active = "active",
  Banned = "banned",
  Suspended = "suspended"
}

enum UserRole {
  normal = "normal",
  premium = "premium",
  admin = "admin",
  team = "team",
  business = "business"
}

enum UserType {
  Customer = "customer",
  Admin = "admin",
  Moderator = "moderator"
}

interface User extends Document {
  username: string;
  email: string;
  password: string;
  fcmToken: string;
  userRole: UserRole;
  is2FAEnabled: boolean;
  mfaEnabled: boolean;
  mfaSecret: string;
  userStatus: UserStatus;
  isSoftDeleted: boolean;
  isVerified: boolean;
  refreshToken: string;
  userType: UserType;
  organizations: OrganizationMember[];
  paystackCustomerId: string,
  stripeCustomerId: string



  isValidPassword(password: string): Promise<Error | boolean>;
}

export { User, UserRole, UserStatus, UserType };

