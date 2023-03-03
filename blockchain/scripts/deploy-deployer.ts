import { ethers, network } from "hardhat";
import { getTokenAddress } from "../helpers";

async function main() {
  const tokenAddress = getTokenAddress();

  const deployerFactory = await ethers.getContractFactory("Deployer");
  const deployer = await deployerFactory.deploy(tokenAddress);

  await deployer.deployed();

  console.log("deployer address: ", deployer.address);
}

main().catch((e) => {
  console.log(e);
});
