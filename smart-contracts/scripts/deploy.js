const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying Traceability contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📋 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const Traceability = await hre.ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();

  await traceability.waitForDeployment();
  const contractAddress = await traceability.getAddress();

  console.log("✅ Traceability deployed to:", contractAddress);
  console.log("\n📝 Save this address in your .env file as CONTRACT_ADDRESS");

  // Verify on testnet (if not localhost)
  const network = hre.network.name;
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await traceability.deploymentTransaction().wait(5);

    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified!");
    } catch (error) {
      console.log("⚠️  Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deploy failed:", error);
    process.exit(1);
  });
