const Token = artifacts.require("./Token.sol");
const Deployer = artifacts.require("./Deployer.sol");

module.exports = function(deployer) {
  deployer.deploy(Token).then(() => {
	  return deployer.deploy(Deployer, Token.address)
  }).then(() => {
	  console.table({
		  token: Token.address,
		  deployer: Deployer.address
	  })
  })
};
