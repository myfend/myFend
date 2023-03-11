import { ethers } from "hardhat";
import { getTokenAddress } from "../helpers";

async function main() {
  const tokenAddress = getTokenAddress();

  const deployerFactory = await ethers.getContractFactory("Deployer");
  const deployer = await deployerFactory.deploy(tokenAddress);

  await deployer.deployed();

  console.table({
    "deployer address": deployer.address,
    token: tokenAddress,
  });
}

async function withProject() {
  const deployerFactory = await ethers.getContractFactory("Deployer");
  const deployer = await deployerFactory.attach(
    "0x79AC6fc3b00993364AeD696a2B502621aF40d706"
  );

  const projectId = "63f63631f4b92adef1284654";
  const amount = ethers.utils.parseEther("2000");
  const repay = ethers.utils.parseEther("2020");
  await deployer.deployProject(projectId, amount, repay);

  const projectFactory = await ethers.getContractFactory("Project");

  const address = await deployer.projectAddress(projectId);
  const project = await projectFactory.attach(address);

  console.table({
    amount: amount.toString(),
    repay: repay.toString(),
    address,
    projectId: await project.projectId(),
  });
}

main().catch((e) => {
  console.log(e);
});
