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
  , AirdropUserBalance = require(rootPrefix + '/lib/airdrop_management/user_balance')
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
  gasPrice,
  options) {
  logger.info("\nAirdrop.pay.params");
  logger.info("\nsenderWorkerAddress: ", senderWorkerAddress, "\nsenderWorkerPassphrase: ",senderWorkerPassphrase,
    "\nbeneficiaryAddress: ",beneficiaryAddress, "\ntransferAmount: ",transferAmount, "\ncommissionBeneficiaryAddress ",commissionBeneficiaryAddress,
    "\ncommissionAmount: ",commissionAmount, "\ncurrency: ",currency, "\nintendedPricePoint",intendedPricePoint,
    "\nspender",spender, "\ngasPrice", gasPrice, "\noptions", options);
  const oThis = this;

  const validationResponse = helper.validateAirdropPayParams(senderWorkerAddress,
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    currency,
    intendedPricePoint,
    gasPrice,
    spender);
  logger.info("==========airdrop.pay.validateAirdropPayParams===========");
  logger.info(validationResponse);

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
    // return Big Number
    totalAmount = oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
  }

  const spenderAccountBalanceResponse = await oThis.getBalanceOf(spender);
  logger.info("==========airdrop.pay.senderAccountBalanceResponse===========");
  logger.info(spenderAccountBalanceResponse);
  if (spenderAccountBalanceResponse.isFailure()) {
    return Promise.resolve(responseHelper.error('l_ci_ad_p_1', 'error while getting balance'));
  }

  var airdropUserBalance = new AirdropUserBalance({
    chainId: oThis.chainId,
    airdropContractAddress: oThis.contractAddress,
    userAddresses: [spender]
  });
  const airdropBalanceResult = await airdropUserBalance.perform();
  logger.info("==========airdrop.pay.airdropBalanceResult===========");
  logger.info(airdropBalanceResult);
  if (airdropBalanceResult.isFailure()){
    return Promise.resolve(airdropBalanceResult);
  }

  var userAirdropAmount = !(airdropBalanceResult.data[spender]) ? 0 : airdropBalanceResult.data[spender]
    , userAirdropAmount = new BigNumber(userAirdropAmount)
  ;
  const userInitialBalance = new BigNumber(spenderAccountBalanceResponse.data.balance)
    // Minimum of total and airdrop amount as per contract logic
    , airdropAmountToUse = Math.min(totalAmount.toNumber(), userAirdropAmount.toNumber());
  ;
  if ((userInitialBalance.plus(airdropAmountToUse)).lt(totalAmount)) {
    return Promise.resolve(responseHelper.error('l_ci_ad_p_2', 'insufficient balance for the transaction. (spender+airdropAmountToUse) balance is insufficient for transaction.'));
  }

  var brandedTokenAddress = null;
  const brandedTokenResponse = await oThis.brandedToken();
  if (brandedTokenResponse.isSuccess()) {
    brandedTokenAddress = brandedTokenResponse.data.brandedToken;
  } else {
    return Promise.resolve(brandedTokenResponse);
  }

  var airdropBudgetHolder = null;
  const airdropBudgetHolderResponse = await oThis.airdropBudgetHolder();
  if (airdropBudgetHolderResponse.isSuccess()) {
    airdropBudgetHolder = airdropBudgetHolderResponse.data.airdropBudgetHolder;
  } else {
    return Promise.resolve(airdropBudgetHolderResponse);
  }

  const returnType = basicHelper.getReturnType(options.returnType);
  logger.info("==========airdrop.pay.params===========");
  logger.info(beneficiaryAddress, transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint, spender, userAirdropAmount.toString());
  const transactionObject = currContract.methods.payAirdrop(
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    web3RpcProvider.utils.asciiToHex(currency),
    intendedPricePoint,
    spender,
    userAirdropAmount.toString());

  const notificationData = helper.getNotificationData(
    ['payments.airdrop.pay'],
    notificationGlobalConstant.publisher(),
    'pay',
    contractName,
    oThis.contractAddress,
    web3RpcProvider,
    oThis.chainId,
    options);

  const successCallback = function(receipt) {
    const actualAmountFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(receipt, oThis.addressToNameMap);
    console.log("successCallback");
    console.log(actualAmountFromReceipt);
    if (actualAmountFromReceipt.isSuccess()) {
      return oThis.transactionHelper.afterAirdropPaySuccess(
        brandedTokenAddress,
        oThis.contractAddress,
        spender,
        totalAmount,
        airdropAmountToUse,
        beneficiaryAddress,
        actualAmountFromReceipt.data.actualBeneficiaryAmount,
        commissionBeneficiaryAddress,
        actualAmountFromReceipt.data.actualCommissionAmount,
        actualAmountFromReceipt.data.actualAirdropAmount,
        airdropBudgetHolder);
    } else {
      return oThis.transactionHelper.afterAirdropPayFailure(
        brandedTokenAddress,
        oThis.contractAddress,
        spender,
        totalAmount,
        airdropAmountToUse,
        airdropBudgetHolder);
    }
  };

  const failCallback = function(reason) {
    console.log("failCallback");
    console.log(reason);
    return oThis.transactionHelper.afterAirdropPayFailure(
      brandedTokenAddress,
      oThis.contractAddress,
      spender,
      totalAmount,
      airdropAmountToUse,
      airdropBudgetHolder);
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

  /*return oThis.transactionHelper.debitBalance(oThis.brandedTokenAddress, senderWorkerAddress, totalAmount).then(function(senderDebitCacheResponse) {
    if (senderDebitCacheResponse.isSuccess()) {
      return Promise.resolve(helper.performSend(params, returnType));
    } else {
      return Promise.resolve(senderDebitCacheResponse);
    }
  });
  */
  return oThis.transactionHelper.beforeAirdropPay(
    brandedTokenAddress,
    oThis.contractAddress,
    spender,
    totalAmount,
    airdropAmountToUse,
    airdropBudgetHolder)
    .then(function(beforePayResponse) {
      console.log("beforePayResponse");
      console.log(beforePayResponse);
      // may be this is wrong we need to check success of each element
      if (beforePayResponse.isSuccess()) {
        return Promise.resolve(helper.performSend(params, returnType));
      } else {
        return Promise.resolve(beforePayResponse);
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
  return new Promise(function (onResolve, onReject) {
    const callback = async function (response) {
      var cacheResult = await oThis.pricerCache.getAirdropBudgetHolder();
      if (cacheResult.isSuccess() && cacheResult.data.response != null) {
        //Ignore the balance we already have.
        responseHelper.successWithData({airdropBudgetHolder: cacheResult.data.response});
      }
      //Cache it
      if (response.isSuccess()) {
        await oThis.pricerCache.setAirdropBudgetHolder(response.data.airdropBudgetHolder);
      }
      return response;
    };

    return oThis.pricerCache.getAirdropBudgetHolder()
      .then(async function (cacheResult) {
        if (cacheResult.isSuccess() && cacheResult.data.response != null) {
          return onResolve(responseHelper.successWithData({airdropBudgetHolder: cacheResult.data.response}));
        } else {
          return onResolve( await oThis.getAirdropBudgetHolderFromContract().then(callback));
        }

      })
      .catch(function(err) {
        //Format the error
        return onResolve(responseHelper.error('l_ci_ad_abh_1', 'Something went wrong'));
      });
  });
};


/**
 * Get airdrop budget holder address of airdrop from contract
 *
 * @return {Promise}
 *
 */
Airdrop.prototype.getAirdropBudgetHolderFromContract = function() {
  const oThis = this;
  return new Promise(async function (onResolve, onReject) {
    const transactionObject = currContract.methods.airdropBudgetHolder();
    const encodedABI = transactionObject.encodeABI();
    const transactionOutputs = helper.getTransactionOutputs(transactionObject);
    const response = await helper.call(web3RpcProvider, oThis.contractAddress, encodedABI, {}, transactionOutputs);
    return onResolve(responseHelper.successWithData({airdropBudgetHolder: response[0]}));
  });
};

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
};

