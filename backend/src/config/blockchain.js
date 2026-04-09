const { ethers } = require("ethers");
const path = require("path");
const fs = require("fs");

/**
 * Blockchain Configuration
 * Kết nối tới Smart Contract thông qua ethers.js v6
 */

// Đọc ABI từ file artifact của Hardhat (sau khi compile)
function getContractABI() {
  const artifactPath = path.join(
    __dirname,
    "../../../smart-contracts/artifacts/contracts/Traceability.sol/Traceability.json"
  );

  if (!fs.existsSync(artifactPath)) {
    console.warn(
      "[WARN] Contract artifact not found. Run 'npm run contracts:compile' first."
    );
    return null;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return artifact.abi;
}

// Khởi tạo provider và signer
function getProvider() {
  const rpcUrl = process.env.RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner() {
  const provider = getProvider();
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  return new ethers.Wallet(privateKey, provider);
}

// Khởi tạo contract instance
function getContract() {
  const abi = getContractABI();
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!abi) {
    throw new Error("Contract ABI not available. Compile contracts first.");
  }

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not found in environment variables");
  }

  const signer = getSigner();
  return new ethers.Contract(contractAddress, abi, signer);
}

// Read-only contract (không cần private key)
function getReadOnlyContract() {
  const abi = getContractABI();
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!abi || !contractAddress) return null;

  const provider = getProvider();
  return new ethers.Contract(contractAddress, abi, provider);
}

module.exports = {
  getProvider,
  getSigner,
  getContract,
  getReadOnlyContract,
  getContractABI,
};
