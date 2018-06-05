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
  , eventGlobalConstants = require(rootPrefix + '/lib/global_constant/events')
  , notificationGlobalConstant = require(rootPrefix + '/lib/global_constant/notification')
  , gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit')
  , Pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , AirdropCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop')
  , AirdropUserBalanceKlass = require(rootPrefix + '/services/airdrop_management/user_balance')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

const contractAbi = coreAddresses.getAbiForContract('airdrop')
  , currContract = new web3Provider.eth.Contract(contractAbi)
;

/**
 * @constructor
 *
 * @param {string} airdropContractAddress - airdrop contract address
 * @param {string} chainId - chain ID
 *
 * @augments Pricer
 *
 */
const Airdrop = function (airdropContractAddress, chainId) {
  const oThis = this
  ;

  Pricer.call(oThis, airdropContractAddress, chainId);

  oThis.contractName = 'airdrop';
  oThis.contractAddress = airdropContractAddress;
  oThis.chainId = chainId;

  oThis.airdropCache = new AirdropCacheKlass(chainId, airdropContractAddress);
};

Airdrop.prototype = Object.create(Pricer.prototype);

const AirdropSpecificPrototype = {
  constructor: Airdrop,

  /**
   * Actual pay method - can give rejections of Promise
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
   * @param {Hex} gasPrice - gas price
   * @param {object} options - for params like returnType, tag.
   *
   * @return {promise<result>}
   *
   */
  pay: function (senderWorkerAddress, senderWorkerPassphrase, beneficiaryAddress,
                 transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint,
                 spender, gasPrice, options) {
    const oThis = this
    ;

    return oThis._asyncPay(senderWorkerAddress, senderWorkerPassphrase, beneficiaryAddress,
      transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint,
      spender, gasPrice, options)
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error(`${__filename}::pay::catch`);
          logger.error(error);
          return responseHelper.error({
            internal_error_identifier: 'l_ci_a_pay_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: errorConfig,
            debug_options: {}
          });
        }
      });
  },

  _asyncPay: async function (senderWorkerAddress, senderWorkerPassphrase, beneficiaryAddress,
                             transferAmount, commissionBeneficiaryAddress, commissionAmount, currency, intendedPricePoint,
                             spender, gasPrice, options) {
    logger.debug("\nAirdrop.pay.params");
    logger.debug("\nsenderWorkerAddress: ", senderWorkerAddress, "\nbeneficiaryAddress: ", beneficiaryAddress, "\ntransferAmount: ",
      transferAmount, "\ncommissionBeneficiaryAddress ", commissionBeneficiaryAddress,
      "\ncommissionAmount: ", commissionAmount, "\ncurrency: ", currency, "\nintendedPricePoint", intendedPricePoint,
      "\nspender", spender, "\ngasPrice", gasPrice, "\noptions", options);

    const oThis = this
    ;

    await helper.validateAirdropPayParams(senderWorkerAddress,
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      currency,
      intendedPricePoint,
      gasPrice,
      spender);

    // validate if spender has the balance
    let totalTransferAmount = 0;
    // If currency is not present, amounts are in BT
    if (!currency) {
      totalTransferAmount = basicHelper.convertToBigNumber(0)
        .plus(transferAmount)
        .plus(commissionAmount);
    } else { // amounts are in USD
      totalTransferAmount = await oThis.getEstimatedTotalAmount(transferAmount, commissionAmount, intendedPricePoint);
      logger.debug("=========totalAmount========", totalTransferAmount);
    }

    const spenderOnChainAvailableBalanceResponse = await oThis.getBalanceOf(spender);
    logger.debug("==========airdrop.pay.senderAccountBalanceResponse===========");
    logger.debug(spenderOnChainAvailableBalanceResponse);
    if (spenderOnChainAvailableBalanceResponse.isFailure()) {
      let errorParams = {
        internal_error_identifier: 'l_ci_a_async_pay_1',
        api_error_identifier: 'db_get_failed',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.reject(responseHelper.error(errorParams));
    }

    let spenderOnChainAvailableBalance = basicHelper.convertToBigNumber(spenderOnChainAvailableBalanceResponse.data.balance);
    logger.debug(`\nuserInitialBalance: ${spenderOnChainAvailableBalance.toString(10)}`);

    let spenderAirdropBalanceResponse = await new AirdropUserBalanceKlass({
      chain_id: oThis.chainId,
      airdrop_contract_address: oThis.contractAddress,
      user_addresses: [spender]
    }).perform();

    logger.debug("==========airdrop.pay.airdropBalanceResult===========");
    logger.debug(spenderAirdropBalanceResponse);
    if (spenderAirdropBalanceResponse.isFailure()) {
      return Promise.reject(spenderAirdropBalanceResponse);
    }

    let spenderAirdropBalance = spenderAirdropBalanceResponse.data[spender] ?
      basicHelper.convertToBigNumber(spenderAirdropBalanceResponse.data[spender].balanceAirdropAmount) :
      basicHelper.convertToBigNumber(0)
    ;

    // to give airdrop balance higher preference, we compute the min of total amount and airdrop balance
    let airdropBalanceToUse = BigNumber.min(totalTransferAmount, spenderAirdropBalance)
    ;

    logger.debug(`\nairdropBalanceToUse: ${airdropBalanceToUse.toString(10)}`);
    logger.debug(`\ntotalAmount: ${totalTransferAmount.toString(10)}`);
    logger.debug(`\nuserInitialBalance.plus(airdropBalanceToUse): ${(spenderOnChainAvailableBalance.plus(airdropBalanceToUse)).toString(10)}`);

    // validate if the spender has enough balance (airdrop + on chain available)
    if ((spenderOnChainAvailableBalance.plus(airdropBalanceToUse)).lt(totalTransferAmount)) {
      let errorParams = {
        internal_error_identifier: 'l_ci_a_async_pay_2',
        api_error_identifier: 'insufficient_funds',
        error_config: errorConfig,
        debug_options: {}
      };
      return Promise.reject(responseHelper.error(errorParams));
    }

    const brandedTokenResponse = await oThis.brandedToken();
    if (brandedTokenResponse.isFailure()) return Promise.reject(brandedTokenResponse);

    let brandedTokenAddress = brandedTokenResponse.data.brandedToken;

    const airdropBudgetHolderResponse = await oThis.airdropBudgetHolder();
    if (airdropBudgetHolderResponse.isSuccess()) return Promise.reject(airdropBudgetHolderResponse);

    let airdropBudgetHolder = airdropBudgetHolderResponse.data.airdropBudgetHolder;

    const returnType = basicHelper.getReturnType(options.returnType);
    logger.debug("==========airdrop.pay.params===========");
    logger.debug(beneficiaryAddress, transferAmount, commissionBeneficiaryAddress, commissionAmount, currency,
      intendedPricePoint, spender, spenderAirdropBalance.toString(10));

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


    const postPayParams = {
      beneficiaryAddress: beneficiaryAddress,
      commissionBeneficiaryAddress: commissionBeneficiaryAddress,
      spender: spender,
      brandedTokenAddress: brandedTokenAddress,
      contractAddress: oThis.contractAddress,
      totalAmount: totalTransferAmount.toString(10),
      airdropAmountToUse: airdropBalanceToUse.toString(10),
      airdropBudgetHolder: airdropBudgetHolder,
      chainId: oThis.chainId
    };

    const failCallback = function (reason) {
      return oThis.onAirdropPayFailure(postPayParams);
    };

    const successCallback = async function (receipt) {

      const setAddressToNameMapResponse = await oThis.setAddressToNameMap();
      if (setAddressToNameMapResponse.isFailure()) {
        return setAddressToNameMapResponse;
      }

      const actualAmountsFromReceipt = oThis.transactionHelper.getActualAmountsFromReceipt(receipt, oThis.addressToNameMap,
        eventGlobalConstants.eventAirdropPayment());
      logger.debug("========airdrop.pay.actualAmountsFromReceipt Response========");
      logger.debug(actualAmountsFromReceipt);
      if (actualAmountsFromReceipt.isSuccess()) {
        return await oThis.onAirdropPaySuccess(postPayParams, actualAmountsFromReceipt.data);
      } else {
        return failCallback("Status 0x0");
      }
    };

    const transactionObject = currContract.methods.payAirdrop(
      beneficiaryAddress,
      transferAmount,
      commissionBeneficiaryAddress,
      commissionAmount,
      web3Provider.utils.asciiToHex(currency),
      intendedPricePoint,
      spender,
      spenderAirdropBalance.toString(10));

    const sendPerformParams = {
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

    if (options && options.shouldHandlePostPay == 0) {
      sendPerformParams.processReceipt = 0;
      sendPerformParams.postReceiptProcessParams = postPayParams;
    } else {
      sendPerformParams.processReceipt = 1;
    }

    const beforePayResponse = await oThis.transactionHelper.beforeAirdropPay(
      brandedTokenAddress,
      oThis.contractAddress,
      spender,
      totalTransferAmount,
      airdropBalanceToUse,
      airdropBudgetHolder);

    const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(beforePayResponse);
    if (isAllResponseSuccessful) {
      return Promise.resolve(helper.performSend(sendPerformParams, returnType));
    } else {
      let errorParams = {
        internal_error_identifier: 'l_ci_a_async_pay_3',
        api_error_identifier: 'could_not_process',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('%Error - Something went wrong. It could be that either cache or airdrop used amount promise failed.');
      // TODO: Discuss: we may need to do some revert ?
      return Promise.reject(responseHelper.error(errorParams));
    }
  },

  /**
   * postAirdropPay
   *
   * @param {Object} airdropPostPayParams - airdrop post pay params
   * @param {string} airdropPostPayParams.beneficiaryAddress - beneficiary address
   * @param {string} airdropPostPayParams.commissionBeneficiaryAddress - commission beneficiary address
   * @param {string} airdropPostPayParams.spender - spender address
   * @param {string} airdropPostPayParams.brandedTokenAddress - branded token address
   * @param {string} airdropPostPayParams.contractAddress - contractAddress address
   * @param {string} airdropPostPayParams.airdropBudgetHolder - airdrop budget holder address
   * @param {number} airdropPostPayParams.totalAmount - total amount that was debited from spender account
   * @param {number} airdropPostPayParams.airdropAmountToUse - airdrop amount that was used in the transaction
   * @param {number} airdropPostPayParams.chainId - chain id
   * @param {Object} decodedEvents - decoded events from trasaction receipt
   * @param {number} status - transactions status (0 => failure, 1 => success)
   *
   * @return {promise<result>}
   *
   */
  postAirdropPay: async function (airdropPostPayParams, decodedEvents, status) {
    const oThis = this
    ;

    if (status == 1) {

      const actualAmountsFromReceipt = oThis.transactionHelper.getActualAmountsFromDecodedEvents(decodedEvents,
        eventGlobalConstants.eventAirdropPayment());

      if (actualAmountsFromReceipt.isSuccess()) {
        return await oThis.onAirdropPaySuccess(airdropPostPayParams, actualAmountsFromReceipt.data);
      }
    }

    return await oThis.onAirdropPayFailure(airdropPostPayParams);

  },

  /**
   * onAirdropPaySuccess
   *
   * @param {Object} airdropPostPayParams - airdrop post pay params
   * @param {string} airdropPostPayParams.beneficiaryAddress - beneficiary address
   * @param {string} airdropPostPayParams.commissionBeneficiaryAddress - commission beneficiary address
   * @param {string} airdropPostPayParams.spender - spender address
   * @param {string} airdropPostPayParams.brandedTokenAddress - branded token address
   * @param {string} airdropPostPayParams.contractAddress - contractAddress address
   * @param {string} airdropPostPayParams.airdropBudgetHolder - airdrop budget holder address
   * @param {number} airdropPostPayParams.totalAmount - total amount that was debited from spender account
   * @param {number} airdropPostPayParams.airdropAmountToUse - airdrop amount that was used in the transaction
   * @param {number} airdropPostPayParams.chainId - chain id
   * @param {Object} actualAmountsFromReceipt - Actual transfer amounts from receipt
   *
   * @return {promise<result>}
   *
   */
  onAirdropPaySuccess: async function (airdropPostPayParams, actualAmountsFromReceipt) {

    const oThis = this
      , validationResponse = helper.validatePostAirdropPayParams(airdropPostPayParams);

    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    const brandedTokenAddress = airdropPostPayParams.brandedTokenAddress
      , contractAddress = airdropPostPayParams.contractAddress
      , spender = airdropPostPayParams.spender
      , totalTransferAmount = basicHelper.convertToBigNumber(airdropPostPayParams.totalAmount)
      , airdropAmountToUse = basicHelper.convertToBigNumber(airdropPostPayParams.airdropAmountToUse)
      , beneficiaryAddress = airdropPostPayParams.beneficiaryAddress
      , commissionBeneficiaryAddress = airdropPostPayParams.commissionBeneficiaryAddress
      , airdropBudgetHolder = airdropPostPayParams.airdropBudgetHolder
    ;

    const afterSuccessResponse = await oThis.transactionHelper.afterAirdropPaySuccess(
      brandedTokenAddress,
      contractAddress,
      spender,
      totalTransferAmount,
      airdropAmountToUse,
      beneficiaryAddress,
      actualAmountsFromReceipt.actualBeneficiaryAmount,
      commissionBeneficiaryAddress,
      actualAmountsFromReceipt.actualCommissionAmount,
      actualAmountsFromReceipt.actualAirdropAmount,
      airdropBudgetHolder);

    const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(afterSuccessResponse);
    if (isAllResponseSuccessful) {
      return Promise.resolve(responseHelper.successWithData({}));
    }
    let errorParams = {
      internal_error_identifier: 'l_ci_a_onAirdropPaySuccess_1',
      api_error_identifier: 'could_not_process',
      error_config: errorConfig,
      debug_options: {}
    };
    return Promise.resolve(responseHelper.error(errorParams));
  },

  /**
   * onAirdropPayFailure
   *
   * @param {Object} airdropPostPayParams - airdrop post pay params
   * @param {string} airdropPostPayParams.beneficiaryAddress - beneficiary address
   * @param {string} airdropPostPayParams.commissionBeneficiaryAddress - commission beneficiary address
   * @param {string} airdropPostPayParams.spender - spender address
   * @param {string} airdropPostPayParams.brandedTokenAddress - branded token address
   * @param {string} airdropPostPayParams.contractAddress - contractAddress address
   * @param {string} airdropPostPayParams.airdropBudgetHolder - airdrop budget holder address
   * @param {number} airdropPostPayParams.totalAmount - total amount that was debited from spender account
   * @param {number} airdropPostPayParams.airdropAmountToUse - airdrop amount that was used in the transaction
   * @param {number} airdropPostPayParams.chainId - chain id
   *
   * @return {promise<result>}
   *
   */
  onAirdropPayFailure: async function (airdropPostPayParams) {

    const oThis = this
    ;

    const validationResponse = helper.validatePostAirdropPayParams(airdropPostPayParams);
    if (validationResponse.isFailure()) return Promise.reject(validationResponse);

    const brandedTokenAddress = airdropPostPayParams.brandedTokenAddress
      , contractAddress = airdropPostPayParams.contractAddress
      , spender = airdropPostPayParams.spender
      , totalTransferAmount = basicHelper.convertToBigNumber(airdropPostPayParams.totalAmount)
      , airdropAmountToUse = basicHelper.convertToBigNumber(airdropPostPayParams.airdropAmountToUse)
      , airdropBudgetHolderAddress = airdropPostPayParams.airdropBudgetHolder
    ;

    const afterFailureResponse = await oThis.transactionHelper.afterAirdropPayFailure(
      brandedTokenAddress,
      contractAddress,
      spender,
      totalTransferAmount,
      airdropAmountToUse,
      airdropBudgetHolderAddress);

    const isAllResponseSuccessful = oThis.transactionHelper.isAllResponseSuccessful(afterFailureResponse);
    if (isAllResponseSuccessful) {
      return Promise.resolve(responseHelper.successWithData({}));
    }
    let errorParams = {
      internal_error_identifier: 'l_ci_a_onAirdropPayFailure_1',
      api_error_identifier: 'could_not_process',
      error_config: errorConfig,
      debug_options: {}
    };
    return Promise.resolve(responseHelper.error(errorParams));

  },


  /**
   * Get airdrop budget holder address of airdrop
   *
   * @return {promise<result>}
   *
   */
  airdropBudgetHolder: async function () {
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

    } catch (err) {
      let errorParams = {
        internal_error_identifier: 'l_ci_a_airdropBudgetHolder_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error("lib/contract_interact/airdrop.js:airdropBudgetHolder inside catch ", err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  },

  /**
   * Get airdrop budget holder address of airdrop from contract
   *
   * @return {promise<result>}
   *
   */
  getAirdropBudgetHolderFromContract: async function () {
    const oThis = this
    ;

    const transactionObject = currContract.methods.airdropBudgetHolder()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({airdropBudgetHolder: response[0]}));
  },

  /**
   * Get worker contract address
   *
   * @return {promise<result>}
   *
   */
  getWorkers: async function () {
    const oThis = this
    ;

    const transactionObject = currContract.methods.workers()
      , encodedABI = transactionObject.encodeABI()
      , transactionOutputs = helper.getTransactionOutputs(transactionObject)
      , response = await helper.call(web3Provider, oThis.contractAddress, encodedABI, {}, transactionOutputs);

    return Promise.resolve(responseHelper.successWithData({workerContractAddress: response[0]}));
  }
};

Object.assign(Airdrop, AirdropSpecificPrototype);

module.exports = Airdrop;
