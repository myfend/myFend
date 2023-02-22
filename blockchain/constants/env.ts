import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

export const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS as string;

export const BSC_TESTNET_TOKEN_ADDRESS = process.env
  .BSC_TESTNET_TOKEN_ADDRESS as string;

export const BSC_MAINNET_TOKEN_ADDRESS = process.env
  .BSC_MAINNET_TOKEN_ADDRESS as string;

export const BSC_TESTNET_PRIVATE_KEY = process.env
  .BSC_TESTNET_PRIVATE_KEY as string;

export const BSC_MAINNET_PRIVATE_KEY = process.env
  .BSC_MAINNET_PRIVATE_KEY as string;
