"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/pricer
 *
 */
const rootPrefix = '../..'
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , contractName = 'pricer'
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , currContractAddr = coreAddresses.getAddressForContract(contractName)
  , currContract = new web3RpcProvider.eth.Contract(contractAbi, currContractAddr)  
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , GAS_PRICE = coreConstants.OST_GAS_PRICE
  , GAS_LIMIT = coreConstants.OST_GAS_LIMIT
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
;

/**
 * @constructor
 *
 * 
 */
const Pricer = module.exports = function () {  
  this.contractAddress = currContractAddr;
  currContract.setProvider(web3RpcProvider.currentProvider);
};

Pricer.prototype = {
  /**
  * Get branded token address of pricer
  *
  * @return {Promise}
  *
  */
  brandedToken:  async function () {
    const transactionObject = currContract.methods.brandedToken();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },

  /**
  * Get acceptable margin for the given currency
  *
  * @return {Promise}
  *
  */
  acceptedMargins: async function (currency) {
    const transactionObject = currContract.methods.acceptedMargins(currency);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },

  /**
  * Get address of price oracle for the given currency
  *
  * @return {Promise}
  *
  */
  priceOracles: async function (currency) {
    const transactionObject = currContract.methods.priceOracles(currency);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },


  /**
  * Updates the price oracle address for a given currency
  *
  * @return {Promise}
  *
  */
  setPriceOracle: async function (senderAddress, senderPassphrase, currency, address) {
    const transactionObject = currContract.methods.setPriceOracle(currency,address);
    const encodedABI = transactionObject.encodeABI();
    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      contractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: GAS_PRICE, gas: GAS_LIMIT }
    );
    return Promise.resolve(transactionReceipt);
  },

  /**
  * Remove the price oracle address for a given currency
  *
  * @return {Promise}
  *
  */
  unsetPriceOracle: async function (senderAddress, senderPassphrase, currency) {
    const transactionObject = currContract.methods.unsetPriceOracle(currency);
    const encodedABI = transactionObject.encodeABI();
    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      contractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: GAS_PRICE, gas: GAS_LIMIT }
    );
    return Promise.resolve(transactionReceipt);
  },

  /**
  * Updates the acceptable margin range for a given currency
  *
  * @return {Promise}
  *
  */
  setAcceptedMargin: async function (senderAddress, senderPassphrase, currency, acceptedMargin) {
    const transactionObject = currContract.methods.setAcceptedMargin(currency, acceptedMargin);
    const encodedABI = transactionObject.encodeABI();
    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      contractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: GAS_PRICE, gas: GAS_LIMIT }
    );
    return Promise.resolve(transactionReceipt);
  },


  /**
  * Pay
  *
  * @return {Promise}
  *
  */
  Pricer.prototype.setAcceptedMargin = async function (
    senderAddress, 
    senderPassphrase,
    beneficiaryAddress, 
    transferAmount, 
    commissionBeneficiaryAddress, 
    commissionAmount, 
    currency, 
    intendedPricePoint) {

    const transactionObject = currContract.methods.pay(
      beneficiaryAddress, 
      transferAmount, 
      commissionBeneficiaryAddress, 
      commissionAmount, 
      currency, 
      intendedPricePoint);

    const encodedABI = transactionObject.encodeABI();
  
    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      contractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: GAS_PRICE, gas: GAS_LIMIT }
    );
    return Promise.resolve(transactionReceipt);
  }


  /**
  * Get current price point and token decimal for the price oracle for the give currency
  *
  * @return {Promise}
  *
  */
  getPricePoint: async function (currency) {
    const transactionObject = currContract.methods.getPricePoint(currency);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  }
};

