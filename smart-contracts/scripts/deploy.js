const hre = require("hardhat");

async function main() {
  console.log("Deploying Traceability contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL\n");

  const Traceability = await hre.ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();

  await traceability.waitForDeployment();
  const contractAddress = await traceability.getAddress();

  console.log("✅ Traceability deployed to:", contractAddress);
  console.log("\n📋 Copy this to your .env files:");
  console.log(`   CONTRACT_ADDRESS=${contractAddress}\n`);

  const network = hre.network.name;
  if (network !== "hardhat" && network !== "localhost") {
    console.log(`🔗 View on explorer: https://amoy.polygonscan.com/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ERROR] Deploy failed:", error);
    process.exit(1);
  });
