import { InvoiceDapp } from "../controllers/administratorInvoice";
import {
  CONTROLLER_PRIVATE_KEY,
  DEPLOYER_CONTRACT_ADDRESS,
  TRON_FULL_HOST_URL,
  TRON_PRO_API_KEY,
} from "../constants/dapp";
import { abi as DEPLOYER_ABI } from "../resources/artifacts/TronDeployer.json";
import { InvoiceWithdrawBlockchain } from "../controllers/administratorInvoiceWithdrawal";
import TronWeb from "tronweb";

export default class TronInvoiceDapp
  implements InvoiceDapp, InvoiceWithdrawBlockchain
{
  private tronWeb: any;

  constructor() {
    this.tronWeb = new TronWeb({
      fullHost: TRON_FULL_HOST_URL,
      headers: { "TRON-PRO-API-KEY": TRON_PRO_API_KEY },
      privateKey: CONTROLLER_PRIVATE_KEY,
    });
  }
  async createWalletAddressFor(
    id: string,
    amount: number,
    repaymentAmount: number
  ): Promise<string> {
    const deployer = await this.deployerContract();
    await deployer
      .deployProject(
        id,
        this.tronWeb.toSun(amount),
        this.tronWeb.toSun(repaymentAmount)
      )
      .send({ feeLimit: this.tronWeb.toSun(1000) });

    const res = await deployer.projectAddress(id).call();
    return this.tronWeb.address.fromHex(res);
  }

  async withdrawBalance(from: string, to: string) {
    const deployer = await this.deployerContract();
    await deployer
      .withdrawBalance(from, to)
      .send({ feeLimit: this.tronWeb.toSun(1000) });
  }

  private async deployerContract() {
    return await this.tronWeb.contract(DEPLOYER_ABI, DEPLOYER_CONTRACT_ADDRESS);
  }
}
