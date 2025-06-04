const Token = artifacts.require("./Token.sol");
const Deployer = artifacts.require("./Deployer.sol");

module.exports = function(deployer) {
	const tokenAddress = deployer.network === 'mainnet' ? 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn' : 'TVMZYcbjpjaGqmciUjzuRWzANTXfHxrRCs';
	deployer.deploy(Deployer, tokenAddress).then(() => {
		  console.table({
			  token: tokenAddress,
			  deployer: Deployer.address
		  })

	})
  // deployer.deploy(Token).then(() => {
	//   return deployer.deploy(Deployer, Token.address)
  // }).then(() => {
	//   console.table({
	// 	  token: Token.address,
	// 	  deployer: Deployer.address
	//   })
  // })
};
