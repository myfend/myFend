import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Project", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployProjectFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const tokenFactory = await ethers.getContractFactory("Token");
    const token = await tokenFactory.deploy();

    const projectFactory = await ethers.getContractFactory("Project");
    const projectId = "test-id-ss";

    const project = await projectFactory.deploy(
      projectId,
      ethers.utils.parseEther("2000"),
      ethers.utils.parseEther("2010"),
      token.address
    );

    return { projectId, project, owner, otherAccount, token };
  }

  describe("deposit funds", function () {
    it("Should deposit amount", async function () {
      const { project, token } = await loadFixture(deployProjectFixture);

      await token.approve(project.address, ethers.utils.parseEther("100"));
      await project.deposit(ethers.utils.parseEther("110"));
    });
  });

  describe("repay funds", function () {
    it("Should repay amount", async function () {
      const { project, token } = await loadFixture(deployProjectFixture);

      await token.approve(project.address, ethers.utils.parseEther("2010"));
      await project.repay();
    });

    it("Should fail repay for not approve", async function () {
      const { project } = await loadFixture(deployProjectFixture);

      expect(await project.repay()).to.revertedWith("Invalid repayment amount");
    });

    it("Should fail repay cos already paid", async function () {
      const { project, token } = await loadFixture(deployProjectFixture);

      await token.approve(project.address, ethers.utils.parseEther("100"));
      await project.repay();
      expect(await project.repay()).to.revertedWith("project already repaid");

      console.log(await project.debug());
    });
  });
});
