import { InvoiceDapp } from "../controllers/administratorInvoice";
import { Contract, ethers, utils, Wallet } from "ethers";
import {
  CONTROLLER_PRIVATE_KEY,
  DEPLOYER_CONTRACT_ADDRESS,
  JSON_RPC_PROVIDER_URL,
} from "../constants/dapp";
import { abi as deployerAbi } from "../resources/artifacts/Deployer.json";

export default class EvmInvoiceDapp implements InvoiceDapp {
  async createWalletAddressFor(
    id: string,
    amount: number,
    repaymentAmount: number
  ): Promise<string> {
    const deployer = this.deployerContract();

    const trx = await deployer.deployProject(
      id,
      utils.parseEther(`${amount}`),
      utils.parseEther(`${repaymentAmount}`),
      { gasLimit: 2680596 }
    );
    await trx.wait();

    return await deployer.projectAddress(id);
  }

  private deployerContract() {
    return new Contract(DEPLOYER_CONTRACT_ADDRESS, deployerAbi, this.wallet());
  }

  private wallet() {
    const provider = new ethers.providers.JsonRpcProvider(
      JSON_RPC_PROVIDER_URL
    );
    return new Wallet(CONTROLLER_PRIVATE_KEY, provider);
  }
}
