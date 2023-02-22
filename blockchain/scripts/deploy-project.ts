import { ethers, network } from "hardhat";
import { getTokenAddress } from "../helpers";

async function main() {
  const tokenAddress = getTokenAddress();

  const projectFactory = await ethers.getContractFactory("Project");
  const project = await projectFactory.deploy(2000, 2020, tokenAddress);

  await project.deployed();

  console.log("address: ", project.address);
}

main().catch((e) => {
  console.log(e);
});
