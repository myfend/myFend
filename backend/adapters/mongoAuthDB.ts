import { AuthDb, AuthenticationUser } from "../controllers/authentication";
import User from "../database/models/user";
import { NOT_FOUND } from "../constants/errors";
import { UserFinder } from "./jwtAuthenticator";

export default class MongoAuthDB implements AuthDb, UserFinder {
  async findUserById(id: string): Promise<AuthenticationUser> {
    const user = await User.findById(id);
    if (!user) throw NOT_FOUND;
    return user.toUser();
  }

  async findUserByEmailOrPhone({
    email,
    phone,
  }: {
    email?: string;
    phone?: string;
  }): Promise<AuthenticationUser> {
    let query = {};
    if (email && phone) query = { $or: [{ email }, { phone }] };
    else if (email) query = { email };
    else if (phone) query = { phone };

    const user = await User.findOne(query);
    if (!user) throw NOT_FOUND;
    return user.toUser();
  }
}
