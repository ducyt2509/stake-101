const hre = require('hardhat');
const { saveContractArtifacts } = require('./saveContractArtifacts');
const { saveDeploymentDetails } = require('./saveDeploymentDetails');

async function main() {
  if (hre.network.name === 'hardhat') {
    console.warn(
      'You are trying to deploy a contract to the Hardhat Network, which' +
        ' gets automatically created and destroyed every time. Use the Hardhat' +
        " option '--network localhost'",
    );
  }

  const networkName = hre.network.name;

  const [deployer] = await hre.ethers.getSigners();
  console.log(
    'Deploying the contracts with the account:',
    await deployer.getAddress(),
  );

  const balance = await deployer.getBalance();
  console.log('Account balance:', hre.ethers.utils.formatEther(balance));

  if (balance.lt(hre.ethers.utils.parseEther('0.1'))) {
    throw new Error('Not enough balance to deploy the contract');
  }

  try {
    // Deploy TokenA
    const TokenA = await hre.ethers.getContractFactory('TokenA');
    const tokenA = await TokenA.deploy();
    console.log('TokenA deployed to:', tokenA.address);

    // Deploy NFTB
    const NFTB = await hre.ethers.getContractFactory('NFTB');
    const nftB = await NFTB.deploy();
    console.log('NFTB deployed to:', nftB.address);

    // Deploy Staking with TokenA and NFTB addresses
    const Staking = await hre.ethers.getContractFactory('Staking');
    const staking = await Staking.deploy(tokenA.address, nftB.address);
    console.log('Staking deployed to:', staking.address);

    await tokenA.setStakingContract(staking.address);
    await nftB.setStakingContract(staking.address);
    console.log('TokenA approved for staking');

    // Set tokenA approve for Staking contract full tokenA balance
    await tokenA.approve(
      staking.address,
      hre.ethers.utils.parseEther('1000000000000000000000000000'),
    );

    console.log('Start saving file...');

    // Save contract artifacts and addresses
    await saveContractArtifacts(
      {
        TokenA: tokenA,
        NFTB: nftB,
        Staking: staking,
      },
      hre.network.name,
    );

    // Save deployment transaction details
    await saveDeploymentDetails(
      {
        TokenA: tokenA,
        NFTB: nftB,
        Staking: staking,
      },
      hre.network.name,
    );
  } catch (error) {
    console.error('[ERROR]: ', error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
