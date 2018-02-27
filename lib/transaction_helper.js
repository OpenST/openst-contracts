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
   * Credit airdrop balance in cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditAirdropBalance: function (airdropContractAddress, owner, bigAmount) {

    const oThis = this;

    const params = {
      userAddresses: [owner],
      chainId: oThis.chainId,
      airdropContractAddress: airdropContractAddress
    };
    const userAirdropDetailCache = new UserAirdropDetailCacheKlass(params);
    return userAirdropDetailCache.fetch()
      .then(function (response) {
        /*if (response.isSuccess()) {
          // calculate the new balance that needs to be updated
          return oThis.updateAirdropDetail(airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
        */

        //ALERT: this is temporary
        return response;
      });
  },

  /**
   * Debit airdrop balance in cache
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitAirdropBalance: function (airdropContractAddress, owner, bigAmount) {

    const oThis = this;

    const params = {
      userAddresses: [owner],
      chainId: oThis.chainId,
      airdropContractAddress: airdropContractAddress
    };
    const userAirdropDetailCache = new UserAirdropDetailCacheKlass(params);
    return userAirdropDetailCache.fetch()
      .then(function (response) {
       /* if (response.isSuccess()) {
          // calculate the new balance that needs to be updated
          return oThis.updateAirdropDetail(airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
        */
        //ALERT: this is temporary
        return response;
      });
  },

  //TODO: Discuss and change accordingly
  /**
   * update airdrop detail for the user address
   *
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  updateAirdropDetail: function (airdropContractAddress, owner, bigAmount) {

    const userAirdropDetailModel = new UserAirdropDetailModelKlass();
    return userAirdropDetailModel.updateAirdropUsedAmount(
      owner,
      bigAmount
    );
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

    const debitAirdropBalance = oThis.debitAirdropBalance(airdropAddress, airdropBugdetAddress, estimatedAirdropAmount);

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

    logger.info(`\n======== afterAirdropPayFailure params ===========\n brandedTokenAddress: ${brandedTokenAddress}, airdropAddress: ${airdropAddress}, spender: ${spender}, estimatedPayAmount: ${estimatedPayAmount}, estimatedAirdropAmount: ${estimatedAirdropAmount}, beneficiaryAddress: ${beneficiaryAddress}, actualBeneficiaryAmount: ${actualBeneficiaryAmount}, commissionBeneficiaryAddress: ${commissionBeneficiaryAddress}, actualCommissionBeneficiaryAmount: ${actualCommissionBeneficiaryAmount}, actualAirdropAmount: ${actualAirdropAmount}, airdropBugdetAddress: ${airdropBugdetAddress}\n`);

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
        oThis.debitAirdropBalance(airdropAddress, airdropBugdetAddress, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualAirdropAmount.lt(estimatedAirdropAmount)) {
        const adjustedAmount = estimatedAirdropAmount.minus(actualAirdropAmount);
        oThis.creditAirdropBalance(airdropAddress, airdropBugdetAddress, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
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

    const creditAirdropBalance = oThis.creditAirdropBalance(airdropAddress, airdropBugdetAddress, estimatedAirdropAmount);

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
              if (paymentEventsData.name === '_tokenAmount') {
                isEventDecoded = true;
                actualBeneficiaryAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === '_commissionTokenAmount') {
                isEventDecoded = true;
                actualCommissionAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === '_airdropAmount') {
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
