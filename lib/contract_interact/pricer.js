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
const GAS_LIMIT = coreConstants.OST_GAS_LIMIT;
const currContract = new web3RpcProvider.eth.Contract(contractAbi);
//const logger = require(rootPrefix + '/helpers/custom_console_logger');
//const responseHelper = require(rootPrefix + '/lib/formatter/response');


/**
 * @constructor
 *
 */
const Pricer = module.exports = function (pricerAddress) {
  this.contractAddress = pricerAddress;
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
    const transactionObject = currContract.methods.acceptedMargins(web3RpcProvider.utils.asciiToHex(currency));
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
    const transactionObject = currContract.methods.priceOracles(web3RpcProvider.utils.asciiToHex(currency));
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
  * Get conversion rate of pricer
  *
  * @return {Promise}
  *
  */
  conversionRate: async function () {
    const transactionObject = currContract.methods.conversionRate();
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
  setPriceOracle: function (senderAddress, senderPassphrase, currency, address, gasPrice) {
    if (currency === undefined || currency === '') {
      return Promise.reject('Currency is mandatory');
    }
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(address);
    helper.assertAddress(senderAddress);

    currContract.options.address = this.contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );
    const transactionObject = currContract.methods.setPriceOracle(web3RpcProvider.utils.asciiToHex(currency), address);
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
  * Remove the price oracle address for a given currency
  *
  * @return {Promise}
  *
  */
  unsetPriceOracle: function (senderAddress, senderPassphrase, currency, gasPrice) {
    if (currency === undefined || currency === '') {
      return Promise.reject('Currency is mandatory');
    }
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    helper.assertAddress(senderAddress);

    currContract.options.address = this.contractAddress;
    currContract.setProvider( web3RpcProvider.currentProvider );
    const transactionObject = currContract.methods.unsetPriceOracle(web3RpcProvider.utils.asciiToHex(currency));
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
  * Updates the acceptable margin range for a given currency
  *
  * @return {Promise}
  *
  */
  setAcceptedMargin:  function (senderAddress, senderPassphrase, currency, acceptedMargin, gasPrice) {
    if (currency === undefined || currency === '') {
      return Promise.reject('Currency is mandatory');
    }
    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    if (acceptedMargin<0) {
      return Promise.reject('Accepted margin cannot be negetive');
    }
    helper.assertAddress(senderAddress);

    //TODO: Convert accepted margin to wei as per token decimal

    const transactionObject = currContract.methods.setAcceptedMargin(web3RpcProvider.utils.asciiToHex(currency), acceptedMargin);
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
    intendedPricePoint,
    gasPrice) {

    if (gasPrice === undefined || gasPrice === '' || gasPrice == 0 ) {
      return Promise.reject('GasPrice is mandatory');
    }
    if (transferAmount < 0) {
      return Promise.reject('Transfer amount cannot be negetive');
    }
    if (commissionAmount < 0) {
      return Promise.reject('Commission amount cannot be negetive');
    }
    helper.assertAddress(senderAddress);
    if (transferAmount > 0 || (beneficiaryAddress !== undefined && beneficiaryAddress !== '')) {
      helper.assertAddress(beneficiaryAddress);
    }
    if (commissionAmount > 0 || (commissionBeneficiaryAddress !== undefined && commissionBeneficiaryAddress !== '')) {
      helper.assertAddress(commissionBeneficiaryAddress);
    }

    const transactionObject = currContract.methods.pay(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3RpcProvider.utils.asciiToHex(currency),
      intendedPricePoint);

    const encodedABI = transactionObject.encodeABI();

    const transactionReceipt = await helper.safeSendFromAddr(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      senderAddress,
      senderPassphrase,
      { gasPrice: gasPrice, gas: GAS_LIMIT }
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
    if (currency === undefined || currency === '') {
      return Promise.reject('Currency is mandatory');
    }
    const transactionObject = currContract.methods.getPricePoint(web3RpcProvider.utils.asciiToHex(currency));
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
  getPricePointAndCalculatedAmounts: function (
    transferAmount,
    commissionAmount,
    currency) {

    if (currency === undefined || currency === '') {
      return Promise.reject('Currency is mandatory');
    }

    const transactionObject = currContract.methods.getPricePointAndCalculatedAmounts(transferAmount, commissionAmount, web3RpcProvider.utils.asciiToHex(currency));

    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    return helper.call(
      web3RpcProvider,
      this.contractAddress,
      encodedABI,
      {},
      transactionOutputs)
      .then(function (response) {
        return Promise.resolve(response);
      })
      .catch(function(err) {
        return Promise.reject(err);
      });
  },

  /**
   * * @return {BigNumer} 10^18
   */
  toWei: function(value) {
    return web3RpcProvider.utils.toWei(value, "ether");
  }

};

