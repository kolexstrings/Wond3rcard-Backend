

import { User } from "../../resources/user/user.protocol";

declare global {
  namespace Express {
    export interface Request {
      user: User;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
      file?: Multer.File;
    }
  }
}
