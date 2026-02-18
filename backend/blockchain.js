const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const provider = new ethers.providers.JsonRpcProvider(
  "http://127.0.0.1:8545"
);
const signer = provider.getSigner(0);

const contractPath = path.join(
  __dirname,
  "..",
  "blockchain",
  "artifacts",
  "contracts",
  "Voting.sol",
  "Voting.json"
);
const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
if (!CONTRACT_ADDRESS) {
  throw new Error("CONTRACT_ADDRESS is not set in environment");
}

const votingContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contractJson.abi,
  signer
);

module.exports = votingContract;
