import { UserType } from "../../database/models/user";
import { AuthenticationUser } from "../../controllers/authentication";

declare global {
  namespace Express {
    export interface Request {
      user?: AuthenticationUser;
      userType?: UserType;
    }
  }
}
