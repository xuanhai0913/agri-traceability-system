const hre = require("hardhat");

async function main() {
  console.log("Deploying Traceability contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "ETH\n");

  const Traceability = await hre.ethers.getContractFactory("Traceability");
  const traceability = await Traceability.deploy();

  await traceability.waitForDeployment();
  const contractAddress = await traceability.getAddress();

  console.log("Traceability deployed to:", contractAddress);
  console.log("\nSave this address in your .env file as CONTRACT_ADDRESS");

  // Verify on testnet (skip for local network)
  const network = hre.network.name;
  if (network !== "hardhat" && network !== "localhost") {
    console.log("\nWaiting for block confirmations...");
    await traceability.deploymentTransaction().wait(5);

    console.log("Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      console.log("[WARN] Verification failed:", error.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[ERROR] Deploy failed:", error);
    process.exit(1);
  });
