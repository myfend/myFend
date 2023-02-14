import { LenderBlockchain } from "../controllers/lender";
import { ethers, Wallet } from "ethers";
import fs from "fs";
import {
  CONTROLLER_PRIVATE_KEY,
  JSON_RPC_PROVIDER_URL,
} from "../constants/dapp";

export default class CeloLenderBlockchain implements LenderBlockchain {
  async createWalletFor(id: string): Promise<string> {
    const provider = new ethers.providers.JsonRpcProvider(
      JSON_RPC_PROVIDER_URL
    );
    const wallet = new Wallet(CONTROLLER_PRIVATE_KEY, provider);
    const metadata: any = JSON.parse(
      fs.readFileSync("../resources/artifacts/Project.json").toString()
    );

    const factory = new ethers.ContractFactory(
      metadata.abi,
      metadata.bytecode,
      wallet
    );

    const price = ethers.utils.formatUnits(
      await provider.getGasPrice(),
      "gwei"
    );
    const contract = await factory.deploy(2000, 2020, {
      gasLimit: 200000,
      gasPrice: ethers.utils.parseUnits(price, "gwei"),
    });
    await contract.deployed();

    console.log(contract.address);
    return contract.address;
  }
}
