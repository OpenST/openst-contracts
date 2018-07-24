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
  , InstanceComposer = require(rootPrefix + '/instance_composer')
  , coreAbis = require(rootPrefix + '/config/core_abis')
  , coreBins = require(rootPrefix + '/config/core_bins')
;

/**
 * Constructor to access different account and contract addresses and their respective details
 *
 * @constructor
 */
const CoreAddresses = function (configStrategy, instanceComposer) {

  const oThis = this;

  oThis._buildAllAddresses(configStrategy);

};

CoreAddresses.prototype = {

  _addrToContractNameMap: null,

  _allAddresses: null,

  _buildAllAddresses: function (configStrategy) {

    const oThis = this;

    oThis._allAddresses = {

      users: {
        deployer: {
          address: configStrategy.OST_UTILITY_DEPLOYER_ADDR,
          passphrase: configStrategy.OST_UTILITY_DEPLOYER_PASSPHRASE
        },
        ops: {
          address: configStrategy.OST_UTILITY_OPS_ADDR,
          passphrase: configStrategy.OST_UTILITY_OPS_PASSPHRASE
        }
      },

      contracts: {
        pricer: {
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
        },
        workers: {
          abi: coreAbis.workers,
          bin: coreBins.workers
        },
        brandedToken: {
          abi: coreAbis.brandedToken,
          bin: coreBins.brandedToken
        },
        airdrop: {
          abi: coreAbis.airdrop,
          bin: coreBins.airdrop
        }
      }
    }

  },

  // generate a contract address to name map for reverse lookup
  _getAddrToContractNameMap: function () {

    const oThis = this;

    if (oThis._addrToContractNameMap) {
      return oThis._addrToContractNameMap;
    }

    const addrToContractNameMap = oThis._addrToContractNameMap = {};

    for (let contractName in oThis._allAddresses.contracts) {

      let addr = oThis._allAddresses.contracts[contractName].address;

      if (Array.isArray(addr)) {
        for (let i = 0; i < addr.length; i++) {
          addrToContractNameMap[addr[i].toLowerCase()] = contractName;
        }
      } else if (addr !== null && typeof addr !== "undefined") {
        addrToContractNameMap[addr.toLowerCase()] = contractName;
      }

    }

    return oThis._addrToContractNameMap;

  },

  getAddressForUser: function(userName) {
    const oThis = this;
    return oThis._allAddresses.users[userName].address;
  },

  getPassphraseForUser: function(userName) {
    const oThis = this;
    return oThis._allAddresses.users[userName].passphrase;
  },

  getAddressForContract: function(contractName) {
    const oThis = this;
    var contractAddress = oThis._allAddresses.contracts[contractName].address;
    if (Array.isArray(contractAddress)) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddress;
  },

  // This must return array of addresses.
  getAddressesForContract: function(contractName) {
    const oThis = this;
    var contractAddresses = oThis._allAddresses.contracts[contractName].address;
    if (!contractAddresses || !Array.isArray(contractAddresses) || contractAddresses.length===0) {
      throw "Please pass valid contractName to get contract address for: "+contractName;
    }
    return contractAddresses;
  },

  getContractNameFor: function(contractAddr) {
    const oThis = this
      , addrToContractNameMap = oThis._getAddrToContractNameMap()
    ;
    return addrToContractNameMap[(contractAddr || '').toLowerCase()];
  },

  getAbiForContract: function(contractName) {
    const oThis = this;
    return oThis._allAddresses.contracts[contractName].abi;
  },

  getBinForContract: function(contractName) {
    const oThis = this;
    return oThis._allAddresses.contracts[contractName].bin;
  }

};

InstanceComposer.register(CoreAddresses, "getCoreAddresses", true);

module.exports = CoreAddresses;

