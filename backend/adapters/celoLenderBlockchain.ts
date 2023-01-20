import { LenderBlockchain } from "../controllers/lender";

export default class CeloLenderBlockchain implements LenderBlockchain {
  async createWalletFor(id: string): Promise<string> {
    return "";
  }
}
