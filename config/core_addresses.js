"use strict";

/**
 * List of all addresses and there respective abi, bin, passphrase
 * required for platform.
 *
 * And helper methods to access this information using human readable
 * names.
 *
 */

const rootPrefix = ".."
  , coreAbis = require(rootPrefix + '/config/core_abis')
  , coreBins = require(rootPrefix + '/config/core_bins');

const allAddresses = {
  users: {
    deployer: {
      address: process.env.OST_PRICER_DEPLOYER_ADDR,
      passphrase: process.env.OST_PRICER_DEPLOYER_PASSPHRASE
    },
    ops: {
      address: process.env.OST_PRICER_OPS_ADDR,
      passphrase: process.env.OST_PRICER_OPS_PASSPHRASE
    }
  },

  contracts: {
    pricer: {
      address: process.env.OST_PRICER_CONTRACT_ADDR,
      abi: coreAbis.pricer,
      bin: coreBins.pricer
    },
    eip20tokenmock: {
      abi: coreAbis.eip20tokenmock,
      bin: coreBins.eip20tokenmock
    },
    opsManaged: {
      abi: coreAbis.opsManaged,
      bin: coreBins.opsManaged
    }
  }
};

// generate a contract address to name map for reverse lookup
const addrToContractNameMap = {};
for (var contractName in allAddresses.contracts) {
  var addr = allAddresses.contracts[contractName].address;

  if ( Array.isArray(addr) ) {
    for (var i = 0; i < addr.length; i++) {
      addrToContractNameMap[addr[i].toLowerCase()] = contractName;
    }
  } else if ( addr !== null && typeof addr !== "undefined") {
    addrToContractNameMap[addr.toLowerCase()] = contractName;
  }
}

// helper methods to access difference addresses and their respective details
const coreAddresses = {
  getAddressForUser: function(userName) {
    return allAddresses.users[userName].address;
  },

  getPassphraseForUser: function(userName) {
    return allAddresses.users[userName].passphrase;
  },

  getAddressForContract: function(contractName) {
    var contractAddress = allAddresses.contracts[contractName].address;
    if (Array.isArray(contractAddress)) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddress;
  },

  // This must return array of addresses.
  getAddressesForContract: function(contractName) {
    var contractAddresses = allAddresses.contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length===0) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddresses;
  },

  getContractNameFor: function(contractAddr) {
    return addrToContractNameMap[(contractAddr || '').toLowerCase()];
  },

  getAbiForContract: function(contractName) {
    return allAddresses.contracts[contractName].abi;
  },

  getBinForContract: function(contractName) {
    return allAddresses.contracts[contractName].bin;
  }
};

module.exports = coreAddresses;

