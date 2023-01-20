import { Lender, LenderDB, UserStoreInput } from "../controllers/lender";
import User, { UserType } from "../database/models/user";
import { UserFinder } from "./jwtAuthenticator";
import { Types } from "mongoose";

export default class MongoLenderDb implements LenderDB, UserFinder {
  async create(input: UserStoreInput): Promise<Lender> {
    const user = await User.create({
      ...input,
      type: UserType.Lender,
      wallet: { address: "", balance: 0 },
    });

    return user.toLender();
  }

  async updateWalletAddress(id: string, address: string): Promise<Lender> {
    const objectId = new Types.ObjectId(id);
    const user = await User.findById(objectId);
    if (!user || user.type !== UserType.Lender) throw new Error("not found");

    if (user.wallet && !user.wallet.address) {
      user.wallet.address = address;
    } else if (!user.wallet) {
      user.wallet = { balance: 0, address, available: 0 };
    }

    await user.save();
    return user.toLender();
  }
  async findUserById(id: string): Promise<Lender> {
    const objectId = new Types.ObjectId(id);
    const user = await User.findById(objectId);
    if (!user) throw new Error("user not found");
    return user.toLender();
  }
}
