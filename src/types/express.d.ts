import { User } from "../resources/user/user.protocol";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}
