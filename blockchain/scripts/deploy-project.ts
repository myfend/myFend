import { ethers } from "hardhat";

async function main() {
    const projectFactory = await ethers.getContractFactory("Project");
    const project = await projectFactory.deploy(2000, 2020);

    await project.deployed();

    console.log("address: ", project.address)
}

main().catch((e) => {console.log(e)})