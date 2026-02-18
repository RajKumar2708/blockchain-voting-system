require("@nomiclabs/hardhat-ethers");
require("dotenv").config();

const rawPrivateKey = (process.env.PRIVATE_KEY || "").trim();
const normalizedPrivateKey = rawPrivateKey
  ? (rawPrivateKey.startsWith("0x") ? rawPrivateKey : `0x${rawPrivateKey}`)
  : "";
const rpcUrl = (process.env.RPC_URL || "").trim();
const hasValidPrivateKey = /^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey);

if (!rpcUrl || /your_.*_url/i.test(rpcUrl)) {
  throw new Error("Set a valid RPC_URL in blockchain/.env (Sepolia endpoint).");
}

if (!hasValidPrivateKey) {
  throw new Error(
    "Set PRIVATE_KEY in blockchain/.env as 64 hex chars (with or without 0x)."
  );
}

module.exports = {
  solidity: "0.8.20",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545"
    },
    sepolia: {
      url: rpcUrl,
      accounts: [normalizedPrivateKey]
    }
  }
};
