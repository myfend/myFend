import deployerMetadata from "../artifacts/contracts/Deployer.sol/Deployer.json";
import tokenMetadata from "../artifacts/contracts/Token.sol/Token.json";
import axios from "axios";

async function walletDeployContract(param: {
  bytecode: string;
  wallet_address: string;
  name: string;
  abi: string;
  parameter?: string;
}) {
  const response = await axios.post(
    "https://api.shasta.trongrid.io/wallet/deploycontract",
    param
  );

  return response.data;
}

async function main() {
  const { contract_address: tokenAddress } = await walletDeployContract({
    abi: JSON.stringify(tokenMetadata.abi),
    bytecode: tokenMetadata.bytecode,
    wallet_address: "TMUWzqKnXXFqYW3Yy8m2ebYDQLDkSXemM2",
    name: "Token",
  });

  const { contract_address: deployerAddress } = await walletDeployContract({
    abi: JSON.stringify(deployerMetadata.abi),
    bytecode: deployerMetadata.bytecode,
    wallet_address: "TMUWzqKnXXFqYW3Yy8m2ebYDQLDkSXemM2",
    name: "Deployer",
    parameter: tokenAddress,
  });

  console.table({ tokenAddress, deployerAddress });
}

main();
