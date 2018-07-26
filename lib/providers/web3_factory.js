'use strict';

/**
 * Web3 Provider Factory
 *
 * @module lib/web3/providers/factory
 */

const OSTBase = require('@openstfoundation/openst-base'),
  OstWeb3Pool = OSTBase.OstWeb3Pool;

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

require(rootPrefix + '/config/core_constants');

/**
 * Constructor
 *
 * @constructor
 */
const Web3ProviderFactoryKlass = function(configStrategy, instanceComposer) {};

Web3ProviderFactoryKlass.prototype = {
  /**
   * Type RPC
   *
   * @constant {string}
   *
   */
  typeRPC: 'rpc',

  /**
   * Type WS
   *
   * @constant {string}
   *
   */
  typeWS: 'ws',

  /**
   * Perform
   *
   * @param {string} type - provider type - ws / rpc
   *
   * @return {web3Provider}
   */
  getProvider: function(type) {
    const oThis = this;
    if (oThis.typeRPC === type) {
      return oThis.getUtilityRpcProvider();
    } else if (oThis.typeWS === type) {
      return oThis.getUtilityWsProvider();
    }
    return null;
  },

  getUtilityRpcProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    return OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_RPC_PROVIDER);
  },

  getUtilityWsProvider: function() {
    const oThis = this,
      coreConstants = oThis.ic().getCoreConstants();

    return OstWeb3Pool.Factory.getWeb3(coreConstants.OST_UTILITY_GETH_WS_PROVIDER);
  }
};

InstanceComposer.register(Web3ProviderFactoryKlass, 'getWeb3ProviderFactory', true);

module.exports = Web3ProviderFactoryKlass;
