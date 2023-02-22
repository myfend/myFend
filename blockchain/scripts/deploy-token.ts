import { ethers } from "hardhat";

async function main() {
  const tokenFactory = await ethers.getContractFactory("Token");
  const token = await tokenFactory.deploy();

  await token.deployed();
  console.log("token address: ", token.address);
}

main().catch((e) => {
  console.log(e);
});
