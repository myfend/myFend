import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Deployer", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployDeployerTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token");
    const token = await tokenFactory.deploy();

    await token.deployed();

    const deployerFactory = await ethers.getContractFactory("Deployer");
    const deployer = await deployerFactory.deploy(token.address);

    return { token, deployer, owner, otherAccount };
  }

  describe("Deploying project", function () {
    it("Should deploy project", async function () {
      const { deployer } = await loadFixture(deployDeployerTokenFixture);
      const ProjectFactory = await ethers.getContractFactory("Project");

      const projectId = "lets-do-this";
      await deployer.deployProject(
        projectId,
        ethers.utils.parseEther("2000"),
        ethers.utils.parseEther("2020")
      );
      const address = await deployer.projectAddress(projectId);
      const project = ProjectFactory.attach(address);

      expect(address).to.not.equal(null);
      expect(await project.getProjectId()).is.equal(projectId);
    });
  });
});
