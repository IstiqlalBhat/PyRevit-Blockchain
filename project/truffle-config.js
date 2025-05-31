require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545, // Default Ganache GUI port
      network_id: "*", // Match any network id
    },
  },
  contracts_directory: './src/contracts',
  contracts_build_directory: './src/abis',
  compilers: {
    solc: {
      version: "0.8.19", // Match your contract's solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
}; 