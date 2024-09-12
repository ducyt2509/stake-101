require('@nomicfoundation/hardhat-toolbox');
require('@nomicfoundation/hardhat-chai-matchers');
require('dotenv').config();

module.exports = {
  solidity: '0.8.24',
  networks: {
    bnb: {
      url: `https://bsc-testnet.infura.io/v3/${process.env.NETWORK_API_KEY}`,
      accounts: [
        `${
          process.env.PRIVATE_KEY.startsWith('0x')
            ? process.env.PRIVATE_KEY
            : '0x' + process.env.PRIVATE_KEY
        }`,
      ],
      chainId: 97,
    },
    bnbv2: {
      url: `https://bsc-testnet-rpc.publicnode.com`,
      accounts: [
        `${
          process.env.PRIVATE_KEY.startsWith('0x')
            ? process.env.PRIVATE_KEY
            : '0x' + process.env.PRIVATE_KEY
        }`,
      ],
      chainId: 97,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.NETWORK_API_KEY}`,
      accounts: [
        `${
          process.env.PRIVATE_KEY.startsWith('0x')
            ? process.env.PRIVATE_KEY
            : '0x' + process.env.PRIVATE_KEY
        }`,
      ],
    },
    lineaSepolia: {
      url: `https://linea-sepolia.infura.io/v3/${process.env.NETWORK_API_KEY}`,
      accounts: [
        `${
          process.env.PRIVATE_KEY.startsWith('0x')
            ? process.env.PRIVATE_KEY
            : '0x' + process.env.PRIVATE_KEY
        }`,
      ],
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  sourcify: {
    enabled: true,
  },
};
