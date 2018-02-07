//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */
const rootPrefix = '../..';
const helper = require(rootPrefix + '/lib/contract_interact/helper');
const coreAddresses = require(rootPrefix + '/config/core_addresses');
const web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc');
const coreConstants = require(rootPrefix + '/config/core_constants');
const contractName = 'eip20tokenmock';
const contractAbi = coreAddresses.getAbiForContract(contractName);
const GAS_LIMIT = coreConstants.OST_GAS_LIMIT;
const currContract = new web3RpcProvider.eth.Contract(contractAbi);


/**
 * @constructor
 *
 */
const MockToken = module.exports = function (mockTokenAddress) {
  this.contractAddress = mockTokenAddress;
};

MockToken.prototype = {

  /**
  * Get balance of address
  *
  * @return {Promise}
  *
  */
  balanceOf: async function (ownerAddress) {
    const transactionObject = currContract.methods.balanceOf(ownerAddress);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },

  /**
  * Set balance
  *
  * @return {Promise}
  *
  */
  setBalance: function (senderAddress, senderPassphrase, ownerAddress, value, gasPrice) {
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(ownerAddress);
    helper.assertAddress(senderAddress);

    currContract.options.address = this.contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );
    const transactionObject = currContract.methods.setBalance(ownerAddress, value);
    const encodedABI = transactionObject.encodeABI();
    return helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: gasPrice, gas: GAS_LIMIT }
    ).then(function(transactionReceipt) {
      return Promise.resolve(transactionReceipt);
    });
  },

  /**
  * Set balance
  *
  * @return {Promise}
  *
  */
  setConversionRate: function (senderAddress, senderPassphrase, conversionRate, gasPrice) {
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(senderAddress);

    currContract.options.address = this.contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );
    const transactionObject = currContract.methods.setConverionRate(conversionRate);
    const encodedABI = transactionObject.encodeABI();
    return helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: gasPrice, gas: GAS_LIMIT }
    ).then(function(transactionReceipt) {
      return Promise.resolve(transactionReceipt);
    });
  },

  approve: function (senderAddress, senderPassphrase, spenderAddress, value, gasPrice) {
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(senderAddress);
    helper.assertAddress(spenderAddress);

    currContract.options.address = this.contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );
    const transactionObject = currContract.methods.approve(spenderAddress, value);
    const encodedABI = transactionObject.encodeABI();
    return helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: gasPrice, gas: GAS_LIMIT }
    ).then(function(transactionReceipt) {
      return Promise.resolve(transactionReceipt);
    });
  }

};

