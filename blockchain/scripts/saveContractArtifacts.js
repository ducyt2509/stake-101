const path = require('path');
const fs = require('fs');
const hre = require('hardhat');

function saveContractArtifacts(contracts, networkName) {
  console.log('Saving contract artifacts and addresses...');
  console.log('networkName: ', networkName);

  const rootContractsDir = path.join(__dirname, '..', '..', 'contracts');

  if (!fs.existsSync(rootContractsDir)) {
    fs.mkdirSync(rootContractsDir, { recursive: true });
  }

  const addressesPath = path.join(rootContractsDir, 'contract-addresses.json');

  let contractAddresses = {};

  if (fs.existsSync(addressesPath)) {
    contractAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
  }

  if (!contractAddresses[networkName]) {
    contractAddresses[networkName] = {};
  }

  // Save contract addresses and artifacts
  for (const [contractName, contractInstance] of Object.entries(contracts)) {
    const address = contractInstance.address;

    if (address) {
      contractAddresses[networkName][contractName] = address;

      try {
        const artifact = hre.artifacts.readArtifactSync(contractName);
        const artifactPath = path.join(
          rootContractsDir,
          `${contractName}.json`,
        );
        fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
        console.log(`Artifact for ${contractName} saved to ${artifactPath}`);
      } catch (error) {
        console.error(`Failed to read artifact for ${contractName}:`, error);
      }
    }
  }

  fs.writeFileSync(
    addressesPath,
    JSON.stringify(contractAddresses, undefined, 2),
  );

  console.log(
    `Contract addresses and artifacts saved to contracts folder in root for network: ${networkName}`,
  );
  console.log(`rootContractsDir: ${rootContractsDir}`);
}

module.exports = { saveContractArtifacts };
