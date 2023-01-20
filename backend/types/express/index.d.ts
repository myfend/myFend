import { Lender } from "../../controllers/lender";
import { UserType } from "../../database/models/user";

declare global {
  namespace Express {
    export interface Request {
      user?: Lender;
      userType?: UserType;
    }
  }
}
