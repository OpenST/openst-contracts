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

    // first get branded
    const brandedToken = new Token(brandedTokenAddress, oThis.chainId);

    return brandedToken.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          // may be we should add a check if this goes negetive or may be not.
          const newBalance = balance.minus(bigAmount);
          oThis.setBalanceInCache(brandedTokenAddress, owner, newBalance);
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
    return balanceCache.setBalanceToCache(owner, bigAmount)
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
        if (response.isSuccess()) {
          // calculate the new balance
          oThis.updateAirdropDetail(airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
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
        if (response.isSuccess()) {
          // calculate the new balance
          oThis.updateAirdropDetail(airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
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
  * updateBalanceCacheOnReceipt
  *
  * @param {string} brandedTokenAddress - branded token address
  * @param {BigNumber} initialDebitAmount - amount that was debited
  * @param {string} senderAddress - address of sender account
  * @param {string} beneficiaryAddress - address of beneficiary account
  * @param {string} commissionBeneficiaryAddress - address of commision beneficiary account
  * @param {Object} transactionReceipt - transaction receipt
  *
  * @return {Promise}
  *
  */
  updateBalanceCacheOnReceipt: function(
    brandedTokenAddress,
    initialDebitAmount,
    senderAddress,
    beneficiaryAddress,
    commissionBeneficiaryAddress,
    transactionReceipt) {

    const oThis = this;
    // decode events
    const decodedEvent = eventDecoder.perform(transactionReceipt, oThis.addressToNameMap);
    var actualTransferAmount = new BigNumber(0);
    var actualCommissionAmount = new BigNumber(0);

    if (decodedEvent != undefined || decodedEvent != null) {
      // get event data
      const events =decodedEvent.formattedTransactionReceipt.eventsData;

      if (events != undefined || events != null) {
        // get whats the actual transfer amounts
        for (var i = 0; i < events.length; i++) {
          const eventData = events[i];

          if (eventData.name === 'Payment') {
            const paymentEvents = eventData.events;
            for (var eventCount = 0; eventCount < paymentEvents.length; eventCount++) {
              const paymentEventsData = paymentEvents[eventCount];
              if (paymentEventsData.name === '_tokenAmount') {
                actualTransferAmount = new BigNumber(paymentEventsData.value);
              } else if (paymentEventsData.name === '_commissionTokenAmount') {
                actualCommissionAmount = new BigNumber(paymentEventsData.value);
              }
            }
          }

        }
      }
    }


    // update cache for beneficiary (credit)
    const creditBeneficiaryBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualTransferAmount > 0) {
        oThis.creditBalance(brandedTokenAddress, beneficiaryAddress, actualTransferAmount).then(function(beneficiaryCreditCacheResponse) {              
          onResolve(beneficiaryCreditCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    // update cache for commission beneficiary (credit)
    const creditCommissionBeneficiaryBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualCommissionAmount > 0) {
        oThis.creditBalance(brandedTokenAddress, commissionBeneficiaryAddress, actualCommissionAmount).then(function(commissionBeneficiaryCreditCacheResponse) {              
          Promise.resolve(commissionBeneficiaryCreditCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    // adjustment cache for spender
    const actualTotalAmount = actualTransferAmount.plus(actualCommissionAmount);

    const adjustmentBalancePromise = new Promise(function (onResolve, onReject) {
      if (actualTotalAmount.gt(initialDebitAmount)) {
        const adjustedAmount = actualTotalAmount.minus(initialDebitAmount);
        oThis.debitBalance(brandedTokenAddress, senderAddress, adjustedAmount).then(function(senderAdjustedCreditCacheResponse) {
          onResolve(senderAdjustedCreditCacheResponse);
        });
      } else if (actualTotalAmount.lt(initialDebitAmount)) {
        const adjustedAmount = initialDebitAmount.minus(actualTotalAmount);
        oThis.creditBalance(brandedTokenAddress, senderAddress, adjustedAmount).then(function(senderAdjustedDebitCacheResponse) {
          onResolve(senderAdjustedDebitCacheResponse);
        });
      } else {
        onResolve(responseHelper.successWithData({}));
      }
    });

    return Promise.all([creditBeneficiaryBalancePromise, creditCommissionBeneficiaryBalancePromise, adjustmentBalancePromise]);

  },

  /**
  * rollBackBalanceCache
  *
  * @param {string} brandedTokenAddress - branded token address
  * @param {string} senderAddress - address of sender account
  * @param {BigNumber} totalAmount - amount that needs to be credited
  *
  * @return {Promise}
  *
  */
  rollBackBalanceCache: function(brandedTokenAddress, senderAddress, totalAmount) {

    const oThis = this;
    return new Promise(function (onResolve, onReject) {
      oThis.creditBalance(brandedTokenAddress, senderAddress, totalAmount).then(function(senderCreditCacheResponse) {
        onResolve(senderCreditCacheResponse);
      });
    });
  }
};
