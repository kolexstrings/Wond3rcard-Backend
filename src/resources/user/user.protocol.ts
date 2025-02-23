import { Document } from "mongoose";
import { OrganizationMember } from "../organization/organization.protocol";

enum UserStatus {
  Active = "active",
  Suspended = "suspended",
  Banned = "banned",
}

enum UserRole {
  Admin = "admin",
  Staff = "staff",
  Customer = "customer",
}

enum UserTiers {
  Basic = "basic",
  Premium = "premium",
  Business = "business",
}

//we need to completely replace UserType in the code base
enum UserType {
  Customer = "customer",
  Admin = "admin",
  Moderator = "moderator",
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
  userTiers: UserTiers;
  organizations: OrganizationMember[];
  paystackCustomerId: string;
  stripeCustomerId: string;

  isValidPassword(password: string): Promise<Error | boolean>;
}

export { User, UserRole, UserStatus, UserTiers };
