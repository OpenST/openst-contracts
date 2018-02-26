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
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , BigNumber = require('bignumber.js')
;

const notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
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

Airdrop.prototype = Object.create(Pricer.prototype);

Airdrop.prototype.constructor = Airdrop;

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
 * @param {Hex} spender - User address
 * @param {BigNumber} airdropAmount - Airdrop amount to spend
 * @param {object} options - for params like returnType, tag.
 *
 * @return {Promise}
 *
 */
Airdrop.prototype.pay = async function (
  senderWorkerAddress,
  senderWorkerPassphrase,
  beneficiaryAddress,
  transferAmount,
  commissionBeneficiaryAddress,
  commissionAmount,
  currency,
  intendedPricePoint,
  spender,
  airdropAmount,
  gasPrice,
  options) {

  logger.info("Airdrop.pay");
  const oThis = this;

  const validationResponse = helper.validateAirdropPayParams(senderWorkerAddress,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    spender,
    airdropAmount);

  if (validationResponse.isFailure()) {
    return Promise.resolve(validationResponse);
  }

  // validate if spender has the balance
  var totalAmount = 0;
  // If currency is not present
  if (!currency) {
    totalAmount = new BigNumber(0)
      .plus(transferAmount)
      .plus(commissionAmount);
  } else {
    totalAmount = oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
  }

  const senderAccountBalanceResponse = await oThis.getBalanceOf(spender);

  if (senderAccountBalanceResponse.isFailure()) {
    return Promise.resolve(responseHelper.error('l_ci_ad_p_1', 'error while getting balance'));
  }
  const userInitialBalance = new BigNumber(senderAccountBalanceResponse.data.balance)
    , airdropBalance = new BigNumber(airdropAmount)
  ;
  if (userInitialBalance.lt(totalAmount)) {
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

  const notificationData = helper.getNotificationData(
    ['payment.airdrop.pay'],
    notificationGlobalConstant.publisher(),
    'pay',
    contractName,
    oThis.contractAddress,
    web3RpcProvider,
    oThis.chainId,
    options);

  const successCallback = function(receipt) {
    return oThis.transactionHelper.updateBalanceCacheOnReceipt(oThis.brandedTokenAddress, totalAmount, senderWorkerAddress, beneficiaryAddress, commissionBeneficiaryAddress, receipt, oThis.addressToNameMap);
  };

  const failCallback = function(reason) {
    return oThis.transactionHelper.rollBackBalanceCache(oThis.brandedTokenAddress, senderWorkerAddress, totalAmount);
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

  return oThis.transactionHelper.debitBalance(oThis.brandedTokenAddress, senderWorkerAddress, totalAmount).then(function(senderDebitCacheResponse) {
    if (senderDebitCacheResponse.isSuccess()) {
      return Promise.resolve(helper.performSend(params, returnType));
    } else {
      return Promise.resolve(senderDebitCacheResponse);
    }
  });

};

/**
 * Get airdrop budget holder address of airdrop
 *
 * @return {Promise}
 *
 */
Airdrop.prototype.airdropBudgetHolder = function() {
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
Airdrop.prototype.getWorkers = function() {
  const oThis = this;
  return new Promise(async function (onResolve, onReject) {
    const transactionObject = currContract.methods.workers();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
    return onResolve(responseHelper.successWithData({workerContractAddress: response[0]}));
  });
}