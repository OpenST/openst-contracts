//"use strict";

/**
 *
 * This is transaction helper that manages the cache updation<br><br>
 *
 * @module lib/cache_management/transaction_cache_helper
 *
 */
const rootPrefix = '..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , BalanceCache =  require(rootPrefix + '/lib/cache_management/balance')
  , Token = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , UserAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_management/user_airdrop_detail')
  , UserAirdropDetailModelKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , eventDecoder = require(rootPrefix + '/lib/web3/events/decoder')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , eventGlobalConstants = require(rootPrefix+'/lib/global_constant/events')
  , airdropKlass = require(rootPrefix + '/app/models/airdrop')
;


/**
 * constructor
 *
 * @param {string} chainId - chain id
 * @constructor
 */
const TransactionHelper = module.exports= function(chainId) {
  const oThis = this;
  oThis.chainId = chainId;
};

TransactionHelper.prototype = {

  /**
   * Credit balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditBalance: function (brandedTokenAddress, owner, bigAmount) {

    const oThis = this;

    // first get branded
    const brandedToken = new Token(brandedTokenAddress, oThis.chainId);

    return brandedToken.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          const newBalance = balance.plus(bigAmount);
          oThis.setBalanceInCache(brandedTokenAddress, owner, newBalance);
          logger.info(`\n========= creditBalance success: ${bigAmount.toString()} to ${owner} =========\n`);
        } else {
          logger.error(`\n========= creditBalance failed: ${bigAmount.toString()} to ${owner} =========\n`);
        }
        return response;
      });
  },

  /**
   * Debit balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitBalance: function (brandedTokenAddress, owner, bigAmount) {

    const oThis = this;

    const brandedToken = new Token(brandedTokenAddress, oThis.chainId);

    return brandedToken.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          const newBalance = balance.minus(bigAmount);
          oThis.setBalanceInCache(brandedTokenAddress, owner, newBalance);
          logger.info(`\n========= debitBalance success: ${bigAmount.toString()} to ${owner} =========\n`);
        } else {
          logger.error(`\n========= debitBalance failed: ${bigAmount.toString()} to ${owner} =========\n`);
        }
        return response;
      });
  },

  /**
   * Set balance in cache
   *
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  setBalanceInCache: function (brandedTokenAddress, owner, bigAmount) {
    const oThis = this;
    const balanceCache = new BalanceCache(oThis.chainId, brandedTokenAddress);
    return balanceCache.setBalance(owner, bigAmount)
      .then(function (setResponse) {
        if (setResponse.isSuccess() && setResponse.data.response != null) {
          return responseHelper.successWithData({});
        }
        return responseHelper.error('l_cm_th_setBalanceInCache_1', setResponse);
      });
  },


  /**
   * Credit airdrop balance in db and clear cache
   * It decreases airdrop_used_amount for user in user_airdrop_details table
   * Clears the cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditAirdropBalance: async function (airdropContractAddress, owner, bigAmount) {

    const oThis = this;
    const userAirdropDetailModel = new UserAirdropDetailModelKlass();
    var r = await userAirdropDetailModel.creditAirdropUsedAmount(airdropContractAddress, owner, bigAmount.toString());
    logger.info("========creditAirdropBalance.result========");
    logger.info(r);
    if (r.isSuccess()) {
      oThis.clearUserDetailCache(airdropContractAddress, owner);
    }
    return r;
  },

  /**
   * Debit airdrop balance in db and clear cache
   * It increases airdrop_used_amount for user in user_airdrop_details table
   * Clears the cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitAirdropBalance: async function (airdropContractAddress, owner, bigAmount) {
    const oThis = this;
    const userAirdropDetailModel = new UserAirdropDetailModelKlass();
    var r = await userAirdropDetailModel.debitAirdropUsedAmount(airdropContractAddress, owner, bigAmount.toString());
    logger.info("========debitAirdropBalance.result========");
    logger.info(r);
    if (r.isSuccess()) {
      oThis.clearUserDetailCache(airdropContractAddress, owner);
    }
    return r;
  },


  /**
   * Clear user detail cache for the user addressess
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  clearUserDetailCache: async function(airdropContractAddress, owner) {
    const oThis = this;
    logger.info("\n======== getByContractAddress =========\n");
    const airdropModel = new airdropKlass();
    const airdropModelResult = await airdropModel.getByContractAddress(airdropContractAddress);
    const airdropRecord = airdropModelResult[0];
    logger.info(`\n======== airdropRecord: ${airdropRecord.id} =========\n`);
    const userAirdropDetailCache = new UserAirdropDetailCacheKlass({
      chainId: oThis.chainId,
      airdropId: airdropRecord.id,
      userAddresses: [owner]
    });
    logger.info("\n======== clear airdrop detail cache for user =========\n");
    logger.info(`\n======== param=> chainId: ${oThis.chainId}, airdropId: ${airdropRecord.id}, userAddresses: ${[owner]} =========\n`);
    await userAirdropDetailCache.clear();
  },

  /**
   * Before pay function, this is called before the pay is called
   *
   * @return {Promise}
   *
   */
  beforePay: function(
    brandedTokenAddress,
    spender,
    estimatedPayAmount) {
    const oThis = this;

    logger.info(`\n======== beforePay params ===========\n brandedTokenAddress: ${brandedTokenAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}\n`);

    return oThis.debitBalance(brandedTokenAddress, spender, estimatedPayAmount);
  },

  /**
   * After pay function, this is called after the pay is successfull
   *
   * @return {Promise}
   *
   */
  afterPaySuccess: function(
    brandedTokenAddress,
    spender,
    estimatedPayAmount,
    beneficiaryAddress,
    actualBeneficiaryAmount,
    commissionBeneficiaryAddress,
    actualCommissionBeneficiaryAmount) {

    logger.info(`\n======== beforePay params ===========\n brandedTokenAddress: ${brandedTokenAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}, beneficiaryAddress: ${beneficiaryAddress}, actualBeneficiaryAmount: ${actualBeneficiaryAmount}, commissionBeneficiaryAddress: ${commissionBeneficiaryAddress}, actualCommissionBeneficiaryAmount: ${actualCommissionBeneficiaryAmount}\n`);

    const oThis = this;

    const creditBeneficiaryBalance = oThis.creditBalance(brandedTokenAddress, beneficiaryAddress, actualBeneficiaryAmount);
    const creditCommissionBeneficiaryBalance = oThis.creditBalance(brandedTokenAddress, commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount);

    // adjustment cache for spender
    const actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount);

    const adjustmentBalancePromise = new Promise(function (onResolve, onReject) {

      if (actualTotalAmount.gt(estimatedPayAmount)) {
        const adjustedAmount = actualTotalAmount.minus(estimatedPayAmount);
        oThis.debitBalance(brandedTokenAddress, spender, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualTotalAmount.lt(estimatedPayAmount)) {
        const adjustedAmount = estimatedPayAmount.minus(actualTotalAmount);
        oThis.creditBalance(brandedTokenAddress, spender, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
          onResolve(senderAdjustedDebitCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }

    });


    return Promise.all([creditBeneficiaryBalance, creditCommissionBeneficiaryBalance, adjustmentBalancePromise]);
  },

  /**
   * After pay function, this is called after the pay is failed
   *
   * @return {Promise}
   *
   */
  afterPayFailure: function (
    brandedTokenAddress,
    spender,
    estimatedPayAmount) {
    const oThis = this;

    logger.info(`\n======== afterPayFailure params ===========\n brandedTokenAddress: ${brandedTokenAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}\n`);

    return oThis.creditBalance(brandedTokenAddress, spender, estimatedPayAmount);

  },

  /**
   * Before airdrop pay function, this is called before the pay is called
   *
   * @return {Promise}
   *
   */
  beforeAirdropPay: function(
    brandedTokenAddress,
    airdropAddress,
    spender,
    estimatedPayAmount,
    estimatedAirdropAmount,
    airdropBugdetAddress) {

    logger.info(`\n======== beforeAirdropPay params ===========\n brandedTokenAddress: ${brandedTokenAddress}, airdropAddress: ${airdropAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}, estimatedAirdropAmount: ${estimatedAirdropAmount}, airdropBugdetAddress: ${airdropBugdetAddress}\n`);

    const oThis = this;

    const beforePayResult = new Promise(function(onResolve, onReject) {
      const amountToDebit = estimatedPayAmount.minus(estimatedAirdropAmount);
      if (amountToDebit.gt(0)) {
        onResolve(oThis.beforePay(
          brandedTokenAddress,
          spender,
          amountToDebit));
      } else {
        onResolve(onResolve(responseHelper.successWithData({})));
      }
    });

    const debitAirdropBalance = oThis.debitAirdropBalance(airdropAddress, spender, estimatedAirdropAmount);

    return Promise.all([beforePayResult, debitAirdropBalance]);
  },

  /**
   * After airdrop pay function, this is called after the pay is successfull
   *
   * @return {Promise}
   *
   */
  afterAirdropPaySuccess: function(
    brandedTokenAddress,
    airdropAddress,
    spender,
    estimatedPayAmount,
    estimatedAirdropAmount,
    beneficiaryAddress,
    actualBeneficiaryAmount,
    commissionBeneficiaryAddress,
    actualCommissionBeneficiaryAmount,
    actualAirdropAmount,
    airdropBugdetAddress) {

    logger.info(`\n======== afterAirdropPaySuccess params ===========\n brandedTokenAddress: ${brandedTokenAddress}, airdropAddress: ${airdropAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}, estimatedAirdropAmount: ${estimatedAirdropAmount}, beneficiaryAddress: ${beneficiaryAddress}, actualBeneficiaryAmount: ${actualBeneficiaryAmount}, commissionBeneficiaryAddress: ${commissionBeneficiaryAddress}, actualCommissionBeneficiaryAmount: ${actualCommissionBeneficiaryAmount}, actualAirdropAmount: ${actualAirdropAmount}, airdropBugdetAddress: ${airdropBugdetAddress}\n`);

    const oThis = this;

    const creditBeneficiaryBalance = oThis.creditBalance(brandedTokenAddress, beneficiaryAddress, actualBeneficiaryAmount);
    const creditCommissionBeneficiaryBalance = oThis.creditBalance(brandedTokenAddress, commissionBeneficiaryAddress, actualCommissionBeneficiaryAmount);

    const adjustSpenderAmount = new Promise(function(onResolve, onReject) {
      const estimatedDebitAmount = estimatedPayAmount.minus(estimatedAirdropAmount);
      const actualTotalAmount = actualBeneficiaryAmount.plus(actualCommissionBeneficiaryAmount);
      const actualDebitAmount = actualTotalAmount.minus(actualAirdropAmount);
      if (actualDebitAmount.gt(estimatedDebitAmount)) {
        const adjustedAmount = actualDebitAmount.minus(estimatedDebitAmount);
        oThis.debitBalance(brandedTokenAddress, spender, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualDebitAmount.lt(estimatedDebitAmount)) {
        const adjustedAmount = estimatedDebitAmount.minus(actualDebitAmount);
        oThis.creditBalance(brandedTokenAddress, spender, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
          onResolve(senderAdjustedDebitCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    const adjustmentAirdropBalancePromise = new Promise(function (onResolve, onReject) {

      if (actualAirdropAmount.gt(estimatedAirdropAmount)) {
        const adjustedAmount = actualAirdropAmount.minus(estimatedAirdropAmount);
        oThis.debitAirdropBalance(airdropAddress, spender, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualAirdropAmount.lt(estimatedAirdropAmount)) {
        const adjustedAmount = estimatedAirdropAmount.minus(actualAirdropAmount);
        oThis.creditAirdropBalance(airdropAddress, spender, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
          onResolve(senderAdjustedDebitCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }

    });

    const allPromises = [creditBeneficiaryBalance, creditCommissionBeneficiaryBalance, adjustSpenderAmount, adjustmentAirdropBalancePromise];

    return Promise.all(allPromises);
  },

  /**
   * After airdrop pay function, this is called after the pay is failed
   *
   * @return {Promise}
   *
   */
  afterAirdropPayFailure: function (
    brandedTokenAddress,
    airdropAddress,
    spender,
    estimatedPayAmount,
    estimatedAirdropAmount,
    airdropBugdetAddress) {

    logger.info(`\n======== afterAirdropPayFailure params ===========\n brandedTokenAddress: ${brandedTokenAddress}, airdropAddress: ${airdropAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}, estimatedAirdropAmount: ${estimatedAirdropAmount}, airdropBugdetAddress: ${airdropBugdetAddress}\n`);

    const oThis = this;

    const afterPayResult = new Promise(function(onResolve, onReject) {
      const amountToCredit = estimatedPayAmount.minus(estimatedAirdropAmount);
      if (amountToCredit.gt(0)) {
        onResolve(oThis.afterPayFailure(
          brandedTokenAddress,
          spender,
          amountToCredit));
      } else {
        onResolve(onResolve(responseHelper.successWithData({})));
      }
    });

    const creditAirdropBalance = oThis.creditAirdropBalance(airdropAddress, spender, estimatedAirdropAmount);

    const allPromises = [creditAirdropBalance];
    allPromises.concat(afterPayResult);
    return Promise.all(allPromises);

  },


  /**
  * Get actual beneficiary amount, actual commission amount and actual airdrop amount from transactionreceipt
  *
  * @param {Object} transactionReceipt - transaction receipt
  * @param {Object} addressToNameMap - address to name map object
  *
  * @return {Promise}
  *
  */
  getActualAmountsFromReceipt: function(
    transactionReceipt,
    addressToNameMap,
    eventName) {

    const oThis = this;
    // decode events
    const decodedEvent = eventDecoder.perform(transactionReceipt, addressToNameMap);
    var actualBeneficiaryAmount = new BigNumber(0);
    var actualCommissionAmount = new BigNumber(0);
    var actualAirdropAmount = new BigNumber(0);

    var isEventDecoded = false;
    if (decodedEvent != undefined && decodedEvent != null) {
      // get event data
      const events =decodedEvent.formattedTransactionReceipt.eventsData;
      if (events != undefined && events != null) {
        // get whats the actual transfer amounts
        for (var i = 0; i < events.length; i++) {
          const eventData = events[i];
          if (eventData.name === eventName) {
            const paymentEvents = eventData.events;
            for (var eventCount = 0; eventCount < paymentEvents.length; eventCount++) {
              const paymentEventsData = paymentEvents[eventCount];
              if (paymentEventsData.name === eventGlobalConstants.eventAttribute.tokenAmount()) {
                isEventDecoded = true;
                actualBeneficiaryAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === eventGlobalConstants.eventAttribute.commissionTokenAmount()) {
                isEventDecoded = true;
                actualCommissionAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === eventGlobalConstants.eventAttribute.airdropAmount()) {
                isEventDecoded = true;
                actualAirdropAmount = new BigNumber(paymentEventsData.value);
              }
            }
          }

        }
      }
    }
    if (isEventDecoded) {
      return responseHelper.successWithData(
        {
          actualBeneficiaryAmount: actualBeneficiaryAmount,
          actualCommissionAmount: actualCommissionAmount,
          actualAirdropAmount: actualAirdropAmount
        });
    } else {
      return responseHelper.error('l_th_gamfc_1', "No events found in the transaction receipt");
    }

  },


  /**
  * Check if all response is success
  *
  * @param {array} results - response array
  *
  * @return {boolean}
  *
  */
  isAllResponseSuccessful: function (results) {
    var isSuccess = true;
    for (var i = results.length - 1; i >= 0; i--) {
      const resultObject = results[i];
      if (resultObject.isFailure()) {
        isSuccess = false;
        break;
      }
    }
    return isSuccess;
  }

};
