import { InvoiceSmartContract } from "../controllers/administratorInvoice";

export default class CeloInvoice implements InvoiceSmartContract {
  async createWalletAddressFor(id: string): Promise<string> {
    return "";
  }
}
