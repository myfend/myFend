import { ethers, network } from "hardhat";
import { getTokenAddress } from "../helpers";

async function main() {
  const projectFactory = await ethers.getContractFactory("Project");

  const tokenAddress = getTokenAddress();
  const projectId = "63f63631f4b92adef1284654";
  const amount = ethers.utils.parseEther("2000");
  const repay = ethers.utils.parseEther("2020");
  const project = await projectFactory.deploy(
    projectId,
    amount,
    repay,
    tokenAddress
  );

  await project.deployed();

  console.table({
    address: project.address,
    amount: amount.toString(),
    repay: repay.toString(),
    projectId,
    tokenAddress,
  });
}

main().catch((e) => {
  console.log(e);
});
