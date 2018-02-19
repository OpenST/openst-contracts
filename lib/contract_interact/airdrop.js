//"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer.sol contract.<br><br>
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
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , Pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , opsName = 'ops'
;

/**
 * @constructor
 *
 * @param {Hex} airdropContractAddress - airdrop contract address
 * @param {string} chainId - chain ID
 *
 */
const Airdrop = module.exports = function (airdropContractAddress, chainId) {
  const oThis = this;
  oThis.contractAddress = airdropContractAddress;
  oThis.chainId = chainId;
  Pricer.call(this, airdropContractAddress, chainId);
};


Airdrop.prototype = {

  /**
   * Pay
   *
   * @param {string} senderWorkerAddress - address of worker
   * @param {string} senderWorkerPassphrase - passphrase of worker
   * @param {string} beneficiaryAddress - address of beneficiary account
   * @param {BigNumber} transferAmount - transfer amount (in wei)
   * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
   * @param {BigNumber} commissionAmount - commission amount (in wei)
   * @param {string} currency - quote currency
   * @param {BigNumber} intendedPricePoint - price point at which the pay is intended (in wei)
   * @param {string} workerContractAddress - Worker Contract Address
   * @param {Hex} spender - User address
   * @param {BigNumber} airdropAmount - Airdrop amount to spend
   * @param {object} options - for params like returnType, tag.
   *
   * @return {Promise}
   *
   */
  pay: async function (
    senderWorkerAddress,
    senderWorkerPassphrase,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    workerContractAddress,
    spender,
    airdropAmount,
    gasPrice,
    options){

    const oThis = this;

    const validationResponse = helper.validateAirdropPayParams(senderWorkerAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency,
      intendedPricePoint,
      gasPrice,
      workerContractAddress,
      spender,
      airdropAmount);

    if (validationResponse.isFailure()) {
      return Promise.resolve(validationResponse);
    }

    // validate if spender has the balance
    var totalAmount = 0;
    if (helper.isValidCurrency(currency)) {
      totalAmount = oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
    } else {
      totalAmount = new BigNumber(0)
        .plus(transferAmount)
        .plus(commissionAmount);
    }

    const senderAccountBalanceResponse = await oThis.getBalanceOf(spender);

    if (senderAccountBalanceResponse.isFailure()) {
      return Promise.resolve(responseHelper.error('l_ci_ad_p_1', 'error while getting balance'));
    }
    const userInitialBalance = new BigNumber(senderAccountBalanceResponse.data.balance)
      , airdropBalance = new BigNumber(airdropAmount)
    ;
    if ((userInitialBalance.plus(airdropBalance)).lt(totalAmount)) {
      return Promise.resolve(responseHelper.error('l_ci_ad_p_2', 'insufficient balance for the transaction. (spender+airdrop) balance is insufficient for transaction.'));
    }

    const returnType = basicHelper.getReturnType(options.returnType);

    const transactionObject = currContract.methods.payAirdrop(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3RpcProvider.utils.asciiToHex(currency),
      intendedPricePoint,
      spender,
      airdropAmount);

    const notificationData = helper.getNotificaitonData(
      ['payment.airdrop.pay'],
      'pay',
      contractName,
      oThis.contractAddress,
      web3RpcProvider,
      options);

    const successCallback = function(receipt) {
      return oThis.updateBalanceCacheOnReceipt(totalAmount, senderWorkerAddress, beneficiaryAddress, commissionBeneficiaryAddress, receipt);
    };

    const failCallback = function(reason) {
      return oThis.rollBackBalanceCache(senderWorkerAddress, totalAmount);
    };

    const params = {
      transactionObject: transactionObject,
      notificationData: notificationData,
      senderAddress: senderWorkerAddress,
      senderPassphrase: senderWorkerPassphrase,
      contractAddress: oThis.contractAddress,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      web3RpcProvider: web3RpcProvider,
      successCallback: successCallback,
      failCallback: failCallback,
      errorCode: "l_ci_ad_p_3"
    };

    return oThis.token.debitBalanceInCache(senderWorkerAddress, totalAmount).then(function(senderDebitCacheResponse) {
      if (senderDebitCacheResponse.isSuccess()) {
        return Promise.resolve(helper.performSend(params, returnType));
      } else {
        return Promise.resolve(senderDebitCacheResponse);
      }
    });

  },

  /**
   * Get airdrop budget holder address of airdrop
   *
   * @return {Promise}
   *
   */
  airdropBudgetHolder: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      const transactionObject = currContract.methods.airdropBudgetHolder();
      const encodedABI = transactionObject.encodeABI();
      const transactionOutputs = helper.getTransactionOutputs(transactionObject);
      const response = await helper.call(web3RpcProvider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
      return onResolve(responseHelper.successWithData({airdropBudgetHolder: response[0]}));
    });
  },

  /**
   * Get worker contract address
   *
   * @return {Promise}
   *
   */
  getWorkers: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      const transactionObject = currContract.methods.workers();
      const encodedABI = transactionObject.encodeABI();
      const transactionOutputs = helper.getTransactionOutputs(transactionObject);
      const response = await helper.call(web3RpcProvider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
      return onResolve(responseHelper.successWithData({workerContractAddress: response[0]}));
    });
  },

};

// Inherit pricer Contract Interact Layer
Object.assign(Airdrop.prototype, Pricer.prototype);

Airdrop.prototype.constructor = Airdrop;
