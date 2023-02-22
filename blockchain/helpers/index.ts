import { network } from "hardhat";
import {
  BSC_MAINNET_TOKEN_ADDRESS,
  BSC_TESTNET_TOKEN_ADDRESS,
  TOKEN_ADDRESS,
} from "../constants/env";

export function getTokenAddress() {
  switch (network.name) {
    case "bsc-testnet":
      return BSC_TESTNET_TOKEN_ADDRESS;
    case "bsc-mainnet":
      return BSC_MAINNET_TOKEN_ADDRESS;
    default:
      return TOKEN_ADDRESS;
  }
}
