//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer contract.<br><br>
 *
 * @module lib/contract_interact/airdrop
 *
 */
const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3RpcProvider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , contractName = 'airdrop'
  , contractAbi = coreAddresses.getAbiForContract(contractName)
  , gasLimit = coreConstants.OST_GAS_LIMIT
  , currContract = new web3RpcProvider.eth.Contract(contractAbi)
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , uuid = require('uuid')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , Pricer = require('./pricer')
  , opsName = 'ops'
;

/**
 * @constructor
 *
 */
const Airdrop = module.exports = function (airdropAddress) {
  this.contractAddress = airdropAddress;
  Pricer.call(this, airdropAddress);
};

// Inherit Pricer Contract Interact Layer
Airdrop.prototype = Object.create(Pricer.prototype);

Airdrop.prototype.constructor = Airdrop;

Airdrop.prototype = {

  /**
   * Pay
   *
   * @param {string} beneficiaryAddress - address of beneficiary account
   * @param {BigNumber} transferAmount - transfer amount (in wei)
   * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
   * @param {BigNumber} commissionAmount - commission amount (in wei)
   * @param {string} currency - quote currency
   * @param {string} workerContractAddress - Worker Contract Address
   * @param {string} airdropBudgetHolder - airdrop budget holder
   * @param {BigNumber} intendedPricePoint - price point at which the pay is intended (in wei)
   * @param {BigNumber} gasPrice - gas price
   * @param {number} chainId - chain Id
   * @param {object} options - for params like returnType, tag.
   *
   * @return {Promise}
   *
   */
  pay: function (
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    workerContractAddress,
    airdropBudgetHolder,
    intendedPricePoint,
    gasPrice,
    chainId,
    options){

    return new Promise(function (onResolve, onReject) {

      const transactionObject = currContract.methods.airdropPay(beneficiaryAddress, transferAmount,
        commissionBeneficiaryAddress, commissionAmount, currency, workerContractAddress, airdropBudgetHolder);
      const encodedABI = transactionObject.encodeABI();

      helper.sendTxAsync(web3RpcProvider, this.contractAddress, encodedABI, opsName, { gasPrice: gasPrice, gas: gasLimit })
        .then(function(transactionHash){
          onResolve(responseHelper.successWithData({transactionHash: transactionHash}));
        });
    });

  },

  /**
   * Get airdrop budget holder address of airdrop
   *
   * @return {Promise}
   *
   */
  airdropBudgetHolder: async function () {
    return new Promise(function (onResolve, onReject) {
      const transactionObject = currContract.methods.airdropBudgetHolder();
      const encodedABI = transactionObject.encodeABI();
      const transactionOutputs = helper.getTransactionOutputs(transactionObject);
      const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return onResolve(responseHelper.successWithData({airdropBudgetHolder: response[0]}));
    });
  },

  /**
   * Get worker contract address
   *
   * @return {Promise}
   *
   */
  workerContractAddress: async function () {
    return new Promise(function (onResolve, onReject) {
      const transactionObject = currContract.methods.workers();
      const encodedABI = transactionObject.encodeABI();
      const transactionOutputs = helper.getTransactionOutputs(transactionObject);
      const response = await helper.call(web3RpcProvider, this.contractAddress, encodedABI, {}, transactionOutputs);
      return onResolve(responseHelper.successWithData({workerContractAddress: response[0]}));
    });
  },

};