"use strict";

/**
 * This is a utility file which would be used for executing all methods on Owned Contract.<br><br>
 *
 * @module lib/contract_interact/owned_contract
 */

const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Owned contract interact constructor
 *
 * @param {String} contractAddress - address where Contract has been deployed
 * @param {String} web3Provider - web3 provider of network where currContract has been deployed
 * @param {String} currContract - Contract Instance
 * @param {String} defaultGasPrice - default Gas Price
 *
 * @constructor
 */
const OwnedContract = function (contractAddress, web3Provider, currContract, defaultGasPrice) {
  this.contractAddress = contractAddress;
  this.web3Provider = web3Provider;
  this.currContract = currContract;
  this.defaultGasPrice = defaultGasPrice;
  this.currContract.options.address = contractAddress;
  //this.currContract.setProvider( web3Provider.currentProvider );
};

OwnedContract.prototype = {
  /**
   * Initiate Ownership of currContract
   *
   * @param {string} senderName - Sender of this Transaction
   * @param {string} proposedOwner - address to which ownership needs to be transferred
   * @param {object} customOptions - custom params of this transaction
   *
   * @return {promise<result>}
   *
   */
  initiateOwnerShipTransfer: async function(senderName, proposedOwner, customOptions) {
    try {
      const encodedABI = this.currContract.methods.initiateOwnershipTransfer(proposedOwner).encodeABI()
        , options = { gasPrice: this.defaultGasPrice };

      Object.assign(options, customOptions);

      const transactionResponse = await helper.safeSend(
        this.web3Provider,
        this.contractAddress,
        encodedABI,
        senderName,
        options
      );

      return Promise.resolve(transactionResponse);
    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_oc_initiateOwnerShipTransfer_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/owned_contract.js:initiateOwnerShipTransfer inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get address of Owner of currContract
   *
   * @return {promise<string>}
   */
  getOwner: async function() {
    try {
      const transactionObject = this.currContract.methods.proposedOwner()
        , encodedABI = transactionObject.encodeABI()
        , transactionOutputs = helper.getTransactionOutputs( transactionObject )
        , response = await helper.call(this.web3Provider, this.contractAddress, encodedABI, {}, transactionOutputs);

      return Promise.resolve(responseHelper.successWithData({owner: response[0]}));
    } catch(err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_oc_getOwner_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('lib/contract_interact/owned_contract.js:getOwner inside catch:', err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  }
};

module.exports = OwnedContract;