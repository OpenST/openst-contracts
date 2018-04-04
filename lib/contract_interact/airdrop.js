"use strict";

/**
 *
 * This is a utility file which would be used for executing all methods on Pricer.sol contract.<br><br>
 *
 * @module lib/contract_interact/airdrop
 *
 */
const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/ws')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventGlobalConstants = require(rootPrefix+'/lib/global_constant/events')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit')
  , Pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , AirdropCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop')
  , AirdropUserBalanceKlass = require(rootPrefix + '/services/airdrop_management/user_balance')
;

const contractAbi = coreAddresses.getAbiForContract('airdrop')
  , currContract = new web3Provider.eth.Contract(contractAbi)
;

/**
 * @constructor
 *
 * @param {string} airdropContractAddress - airdrop contract address
 * @param {string} chainId - chain ID
 *
 */
const Airdrop = module.exports = function (airdropContractAddress, chainId) {
  const oThis = this
  ;

  Pricer.call(oThis, airdropContractAddress, chainId);

  oThis.contractName = 'airdrop';
  oThis.contractAddress = airdropContractAddress;
  oThis.chainId = chainId;

  oThis.airdropCache = new AirdropCacheKlass(chainId, airdropContractAddress);
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
 * @param {string} spender - User address
 * @param {Hex} gas_price - gas price
 * @param {object} options - for params like returnType, tag.
 *
 * @return {promise<result>}
 *
 */
Airdrop.prototype.pay = async function (senderWorkerAddress, senderWorkerPassphrase, beneficiaryAddress,
  transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint,
  spender, gasPrice, options) {
  logger.debug("\nAirdrop.pay.params");
  logger.debug("\nsenderWorkerAddress: ", senderWorkerAddress, "\nbeneficiaryAddress: ",beneficiaryAddress, "\ntransferAmount: ",transferAmount, "\ncommissionBeneficiaryAddress ",commissionBeneficiaryAddress,
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
  logger.debug("==========airdrop.pay.validateAirdropPayParams===========");
  logger.debug(validationResponse);

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
    totalAmount = await oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
    logger.debug("=========totalAmount========", totalAmount);
  }

  const spenderAccountBalanceResponse = await oThis.getBalanceOf(spender);
  logger.debug("==========airdrop.pay.senderAccountBalanceResponse===========");
  logger.debug(spenderAccountBalanceResponse);
  if (spenderAccountBalanceResponse.isFailure()) {
    return Promise.resolve(responseHelper.error('l_ci_a_pay_1', 'error while getting balance'));
  }
  var AirdropUserBalanceObject = new AirdropUserBalanceKlass({
    chain_id: oThis.chainId,
    airdrop_contract_address: oThis.contractAddress,
    user_addresses: [spender]
  });
  const airdropBalanceResult = await AirdropUserBalanceObject.perform();
  logger.debug("==========airdrop.pay.airdropBalanceResult===========");
  logger.debug(airdropBalanceResult);
  if (airdropBalanceResult.isFailure()){
    return Promise.resolve(airdropBalanceResult);
  }

  var userAirdropAmount = !(airdropBalanceResult.data[spender]) ? 0 : airdropBalanceResult.data[spender].balanceAirdropAmount
    , userAirdropAmount = new BigNumber(userAirdropAmount)
  ;
  const userInitialBalance = new BigNumber(spenderAccountBalanceResponse.data.balance)
    // Minimum of total and airdrop amount as per contract logic
    , airdropAmountToUse = BigNumber.min(totalAmount, userAirdropAmount)
  ;

  logger.debug(`\nuserInitialBalance: ${userInitialBalance.toString(10)}`);
  logger.debug(`\nairdropAmountToUse: ${airdropAmountToUse.toString(10)}`);
  logger.debug(`\ntotalAmount: ${totalAmount.toString(10)}`);
  logger.debug(`\nuserInitialBalance.plus(airdropAmountToUse): ${(userInitialBalance.plus(airdropAmountToUse)).toString(10)}`);

  if ((userInitialBalance.plus(airdropAmountToUse)).lt(totalAmount)) {
    return Promise.resolve(responseHelper.error('l_ci_a_pay_2', 'insufficient balance'));
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
  logger.debug("==========airdrop.pay.params===========");
  logger.debug(beneficiaryAddress, transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint, spender, userAirdropAmount.toString(10));
  const transactionObject = currContract.methods.payAirdrop(
    beneficiaryAddress,
    transferAmount,
    commissionBeneficiaryAddress,
    commissionAmount,
    web3Provider.utils.asciiToHex(currency),
    intendedPricePoint,
    spender,
    userAirdropAmount.toString(10));

  const notificationData = helper.getNotificationData(
    ['transfer.payments.airdrop.pay'],
    notificationGlobalConstant.publisher(),
    'pay',
    oThis.contractName,
    oThis.contractAddress,
    web3Provider,
    oThis.chainId,
    options);
  notificationData.message.payload.erc20_contract_address = brandedTokenAddress;


  const successCallback = async function(receipt) {

    const setAddressToNameMapResponse = await oThis.setAddressToNameMap();
    if (setAddressToNameMapResponse.isFailure()){
      return setAddressToNameMapResponse;
    }

    const actualAmountFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(receipt, oThis.addressToNameMap, eventGlobalConstants.eventAirdropPayment());
    logger.debug("========airdrop.pay.actualAmountFromReceipt Response========");
    logger.debug(actualAmountFromReceipt);
    if (actualAmountFromReceipt.isSuccess()) {
      const afterSuccessResponse = await oThis.transactionHelper.afterAirdropPaySuccess(
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

      const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(afterSuccessResponse);
      if (isAllResponseSuccessful) {
        return afterSuccessResponse;
      } else {
        return responseHelper.error('l_ci_a_pay_3', 'Something went wrong');
      }
    } else {
      const afterFailureResponse = await oThis.transactionHelper.afterAirdropPayFailure(
        brandedTokenAddress,
        oThis.contractAddress,
        spender,
        totalAmount,
        airdropAmountToUse,
        airdropBudgetHolder);

      const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(afterFailureResponse);
      if (isAllResponseSuccessful) {
        return responseHelper.error('l_ci_a_pay_4', 'Something went wrong');
      } else {
        return responseHelper.error('l_ci_a_pay_5', 'Something went wrong');
      }
    }
  };

  const failCallback = async function(reason) {
    const afterFailureResponse = await oThis.transactionHelper.afterAirdropPayFailure(
      brandedTokenAddress,
      oThis.contractAddress,
      spender,
      totalAmount,
      airdropAmountToUse,
      airdropBudgetHolder);

    const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(afterFailureResponse);
    if (isAllResponseSuccessful) {
      return responseHelper.error('l_ci_a_pay_6', 'Something went wrong');
    } else {
      return responseHelper.error('l_ci_a_pay_7', 'Something went wrong');
    }
  };

  const params = {
    transactionObject: transactionObject,
    notificationData: notificationData,
    senderAddress: senderWorkerAddress,
    senderPassphrase: senderWorkerPassphrase,
    contractAddress: oThis.contractAddress,
    gasPrice: gasPrice,
    gasLimit: gasLimitGlobalConstant.airdropPay(),
    web3Provider: web3Provider,
    successCallback: successCallback,
    failCallback: failCallback,
    errorCode: "l_ci_ad_p_3"
  };

  const beforePayResponse = await oThis.transactionHelper.beforeAirdropPay(
    brandedTokenAddress,
    oThis.contractAddress,
    spender,
    totalAmount,
    airdropAmountToUse,
    airdropBudgetHolder);

  const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(beforePayResponse);
  if (isAllResponseSuccessful) {
    return Promise.resolve(helper.performSend(params, returnType));
  } else {
    // TODO: Discuss: we may need to do some revert ?
    return Promise.resolve(responseHelper.error('l_ci_a_pay_8', 'Something went wrong. It could be that either cache or airdrop used amount promise failed.'));
  }
};

/**
 * Get airdrop budget holder address of airdrop
 *
 * @return {promise<result>}
 *
 */
Airdrop.prototype.airdropBudgetHolder = async function() {
  const oThis = this
  ;

  try {
    const cacheResult = await oThis.airdropCache.getAirdropBudgetHolder();
    if (cacheResult.isSuccess() && cacheResult.data.response != null) {
      return Promise.resolve(responseHelper.successWithData({airdropBudgetHolder: cacheResult.data.response}));
    } else {
      const getAirdropBudgetHolderFromContractResponse = await oThis.getAirdropBudgetHolderFromContract();
      if (getAirdropBudgetHolderFromContractResponse.isSuccess()) {
        await oThis.airdropCache.setAirdropBudgetHolder(getAirdropBudgetHolderFromContractResponse.data.airdropBudgetHolder);
      }
      return Promise.resolve(getAirdropBudgetHolderFromContractResponse);
    }

  } catch(err) {
    logger.error("lib/contract_interact/airdrop.js:airdropBudgetHolder inside catch ", err);
    return Promise.resolve(responseHelper.error('l_ci_a_airdropBudgetHolder_1', 'Something went wrong'));
  }
};


/**
 * Get airdrop budget holder address of airdrop from contract
 *
 * @return {promise<result>}
 *
 */
Airdrop.prototype.getAirdropBudgetHolderFromContract = async function() {
  const oThis = this
  ;

  const transactionObject = currContract.methods.airdropBudgetHolder()
    , encodedABI = transactionObject.encodeABI()
    , transactionOutputs = helper.getTransactionOutputs(transactionObject)
    , response = await helper.call(web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);

  return Promise.resolve(responseHelper.successWithData({airdropBudgetHolder: response[0]}));
};

/**
 * Get worker contract address
 *
 * @return {promise<result>}
 *
 */
Airdrop.prototype.getWorkers = async function() {
  const oThis = this
  ;

  const transactionObject = currContract.methods.workers()
    , encodedABI = transactionObject.encodeABI()
    , transactionOutputs = helper.getTransactionOutputs(transactionObject)
    , response = await helper.call(web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);

  return Promise.resolve(responseHelper.successWithData({workerContractAddress: response[0]}));
};

