const { ethers } = require("ethers");
const abiV1 = require("./abi.json");
const abiV2 = require("./abi-v2.json");

/**
 * Blockchain Configuration
 * Kết nối tới Smart Contract thông qua ethers.js v6
 *
 * Production-ready: ABI embedded trực tiếp,
 * không phụ thuộc vào smart-contracts/ folder
 */

// Khởi tạo provider
function getProvider() {
  const rpcUrl = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getContractSchema() {
  const value = String(
    process.env.CONTRACT_STAGE_SCHEMA || process.env.CONTRACT_VERSION || "v1"
  ).toLowerCase();
  return value === "v2" ? "v2" : "v1";
}

function getContractAbi() {
  return getContractSchema() === "v2" ? abiV2 : abiV1;
}

// Khởi tạo signer (cần PRIVATE_KEY)
function getSigner() {
  const provider = getProvider();
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY not found in environment variables");
  }

  return new ethers.Wallet(privateKey, provider);
}

// Contract instance có quyền ghi (write) — cần PRIVATE_KEY
function getContract() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    throw new Error("CONTRACT_ADDRESS not found in environment variables");
  }

  const signer = getSigner();
  return new ethers.Contract(contractAddress, getContractAbi(), signer);
}

// Contract instance chỉ đọc (read-only) — không cần PRIVATE_KEY
function getReadOnlyContract() {
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) return null;

  const provider = getProvider();
  return new ethers.Contract(contractAddress, getContractAbi(), provider);
}

module.exports = {
  getContractSchema,
  getProvider,
  getSigner,
  getContract,
  getReadOnlyContract,
};
