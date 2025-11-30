import { ethers, run, network } from "hardhat";

async function main() {
  console.log("Deploying CertificateValidator contract...");

  // Get the contract factory
  const CertificateValidator = await ethers.getContractFactory("CertificateValidator");
  
  // Deploy the contract
  const certificateValidator = await CertificateValidator.deploy();
  await certificateValidator.waitForDeployment();

  const contractAddress = await certificateValidator.getAddress();
  console.log(`CertificateValidator deployed to: ${contractAddress}`);

  // Get deployer address
  const [deployer] = await ethers.getSigners();
  console.log(`Deployed by: ${deployer.address}`);
  console.log(`Deployer is set as admin and issuer`);

  // Wait for block confirmations on non-local networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("Waiting for block confirmations...");
    const deployTx = certificateValidator.deploymentTransaction();
    if (deployTx) {
      await deployTx.wait(5);
    }
    console.log("Confirmed!");

    // Verify contract on Etherscan
    console.log("\nVerifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("Contract verified successfully");
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error verifying contract:", error.message);
      }
    }
  }

  console.log("\n📝 Contract deployment complete!");
  console.log("====================================");
  console.log(`Network: ${network.name}`);
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Admin/Issuer: ${deployer.address}`);
  console.log("====================================\n");

  return contractAddress;
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
