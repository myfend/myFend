import { AuthDb, AuthenticationUser } from "../controllers/authentication";
import User from "../database/models/user";

export default class MongoAuthDB implements AuthDb {
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
    // else throw new Error("query has to provide email or phone");
    console.log(query);

    const user = await User.findOne(query);
    if (!user) throw new Error("user not found");
    return user.toUser();
  }
}
