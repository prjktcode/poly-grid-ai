const hre = require("hardhat");

async function main() {
  console.log("Deploying DataHiveMarket contract...");

  // Get the contract factory
  const DataHiveMarket = await hre.ethers.getContractFactory("DataHiveMarket");

  // Deploy the contract
  const dataHiveMarket = await DataHiveMarket.deploy();

  await dataHiveMarket.waitForDeployment();

  const address = await dataHiveMarket.getAddress();

  console.log(`DataHiveMarket deployed to: ${address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId}`);

  // Wait for a few block confirmations if on a testnet
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    const deployTx = dataHiveMarket.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(5);
      console.log("Block confirmations completed");
    }

    // Verification instructions
    console.log("\nTo verify the contract on block explorer, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
  }

  return address;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
