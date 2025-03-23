import { User } from "../resources/user/user.protocol";
import { Request } from "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export interface User {
  id: string;
  organizations: {
    orgId: string;
    role: string;
    teams?: {
      teamId: string;
      role: string;
    }[];
  }[];
}

export interface RequestWithUser extends Request {
  user?: User;
}
