module.exports = {
  networks: {
    development: {
      host: 'localhost',
      network_id: '*',
      port: 8545,
      gas: 12000000,
      gasPrice: 0x01,
    },
  },
  compilers: {
    solc: {
      version: '0.5.8',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  },
};
