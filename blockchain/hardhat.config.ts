import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import {
  BSC_MAINNET_PRIVATE_KEY,
  BSC_TESTNET_PRIVATE_KEY,
} from "./constants/env";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: { yul: false },
      },
    },
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
    },
    "bsc-testnet": {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [BSC_TESTNET_PRIVATE_KEY],
    },
    "bsc-mainnet": {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [BSC_MAINNET_PRIVATE_KEY],
    },
  },
};

export default config;
