import { ethers, network } from "hardhat";
import { getTokenAddress } from "../helpers";

async function main() {
  const tokenAddress = getTokenAddress();
  const projectId = "63f63631f4b92adef1284654";

  const projectFactory = await ethers.getContractFactory("Project");
  const project = await projectFactory.deploy(
    projectId,
    ethers.utils.parseEther("2000"),
    ethers.utils.parseEther("2020"),
    tokenAddress
  );

  await project.deployed();

  console.log("project address: ", project.address);
}

main().catch((e) => {
  console.log(e);
});
