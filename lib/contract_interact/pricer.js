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
const contractName = 'pricer';
const contractAbi = coreAddresses.getAbiForContract(contractName);
const currContract = new web3RpcProvider.eth.Contract(contractAbi, currContractAddr);
const GAS_PRICE = coreConstants.OST_GAS_PRICE;
const GAS_LIMIT = coreConstants.OST_GAS_LIMIT;
//const logger = require(rootPrefix + '/helpers/custom_console_logger')


/**
 * @constructor
 *
 */
const Pricer = module.exports = function (pricerAddress) {
  this.contractAddress = pricerAddress;
  currContract.setProvider(web3RpcProvider.currentProvider);
};

Pricer.prototype = {

  /**
  * Get branded token address of pricer
  *
  * @return {Promise}
  *
  */
  brandedToken: async function () {
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
  * Get base currency of pricer
  *
  * @return {Promise}
  *
  */
  baseCurrency: async function () {
    const transactionObject = currContract.methods.baseCurrency();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
    return Promise.resolve(response[0]);
  },

  /**
  * Get decimal of pricer
  *
  * @return {Promise}
  *
  */
  decimals: async function () {
    const transactionObject = currContract.methods.decimals();
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
    const transactionObject = currContract.methods.setPriceOracle(currency, address);
    const encodedABI = transactionObject.encodeABI();
    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddr,
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
      this.contractAddr,
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
      this.contractAddr,
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
  pay: async function (
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
      this.contractAddr,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: GAS_PRICE, gas: GAS_LIMIT }
    );
    return Promise.resolve(transactionReceipt);
  },


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
  },

  /**
  * Get current price point and calculated token amounts
  *
  * @return {Promise}
  *
  */
  getPricePointAndCalculatedAmounts: async function (
    transferAmount,
    commissionAmount,
    currency) {
    const transactionObject = currContract.methods.getPricePointAndCalculatedAmounts(transferAmount, commissionAmount, currency);
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    return helper.call(
      web3RpcProvider, 
      this.contractAddress, 
      encodedABI, 
      {}, 
      transactionOutputs).then(function (response){
        return Promise.resolve(response[0], response[1], response[2]);    
      });
    
  }

  /**
   * * @return {BigNumer} 10^18
   */
  toWei: function(value){
    return web3RpcProvider.utils.toWei(value, "ether");
  }
};

