const path = require('path');
const fs = require('fs');

async function saveDeploymentDetails(contracts, networkName) {
  console.log('Saving deployment transaction details...');
  const rootContractsDir = path.join(__dirname, '..', '..', 'contracts');

  if (!fs.existsSync(rootContractsDir)) {
    fs.mkdirSync(rootContractsDir, { recursive: true });
  }

  const deploymentsPath = path.join(rootContractsDir, 'deployments.json');
  let deploymentDetails = {};

  if (fs.existsSync(deploymentsPath)) {
    deploymentDetails = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
  }

  if (!deploymentDetails[networkName]) {
    deploymentDetails[networkName] = {};
  }

  for (const [contractName, contractInstance] of Object.entries(contracts)) {
    const address = contractInstance.address;
    const transactionHash = contractInstance.deployTransaction.hash;
    try {
      const receipt = await contractInstance.provider.getTransactionReceipt(
        transactionHash,
      );
      const blockNumber = receipt.blockNumber;

      if (address) {
        deploymentDetails[networkName][contractName] = {
          address,
          transactionHash,
          blockNumber,
        };
      }
    } catch (error) {
      console.error(
        `Failed to fetch deployment details for ${contractName}:`,
        error,
      );
    }
  }

  fs.writeFileSync(
    deploymentsPath,
    JSON.stringify(deploymentDetails, undefined, 2),
  );

  console.log(
    `Deployment details saved to ${deploymentsPath} for network: ${networkName}`,
  );
}

module.exports = { saveDeploymentDetails };
