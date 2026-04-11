const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  // Verify network
  console.log("Account:", deployer.address);
  console.log("Network:", hre.network.name);

  // Address to grant/revoke role
  const PRODUCER_ADDRESS = "0x..."; // CHANGE THIS
  const ACTION = "add"; // "add" or "remove"

  if (!PRODUCER_ADDRESS || PRODUCER_ADDRESS === "0x...") {
      console.log("Pleace change the PRODUCER_ADDRESS variable inside scripts/manage_roles.js first");
      return;
  }

  // Load backend .env to get the recent CONTRACT_ADDRESS
  require("dotenv").config({ path: "../backend/.env" });
  const contractAddress = process.env.CONTRACT_ADDRESS;

  if (!contractAddress) {
    console.error("No CONTRACT_ADDRESS found in backend/.env!");
    return;
  }

  console.log(`Connecting to Traceability contract at ${contractAddress}...`);
  const Traceability = await hre.ethers.getContractFactory("Traceability");
  const traceability = Traceability.attach(contractAddress);

  const isAdmin = await traceability.systemAdmin();
  if (isAdmin !== deployer.address) {
      console.error(`You are NOT the systemAdmin! Admin is ${isAdmin}`);
      return;
  }

  console.log(`Executing ${ACTION}Producer for: ${PRODUCER_ADDRESS}`);
  
  let tx;
  if (ACTION === "add") {
      tx = await traceability.addWhitelistedProducer(PRODUCER_ADDRESS);
  } else {
      tx = await traceability.removeWhitelistedProducer(PRODUCER_ADDRESS);
  }

  console.log("Waiting for confirmation...");
  await tx.wait();
  
  const isNowWhitelisted = await traceability.isWhitelistedProducer(PRODUCER_ADDRESS);
  console.log(`SUCCESS! Address ${PRODUCER_ADDRESS} whitelist status is now: ${isNowWhitelisted}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
