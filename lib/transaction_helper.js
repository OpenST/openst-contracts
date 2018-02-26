//"use strict";

/**
 *
 * This is transaction helper that manages the cache updation<br><br>
 *
 * @module lib/cache_management/transaction_cache_helper
 *
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , BalanceCache =  require(rootPrefix + '/lib/cache_management/balance_cache')
  , Token = require('./branded_token')
  , BigNumber = require('bignumber.js')
  , UserAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_management/user_airdrop_detail')
  , UserAirdropDetailModelKlass = require(rootPrefix + '/app/model/user_airdrop_detail')
  ;


/**
 * constructor
 *
 * @constructor
 */
const TransactionHelper = module.exports= function() {
};

TransactionHelper.prototype = {

  /**
   * Credit balance in cache
   *
   * @param {string} chainId - chain id
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditBalance: function (chainId, brandedTokenAddress, owner, bigAmount) {

    const oThis = this;

    // first get branded
    const brandedToken = new Token(brandedTokenAddress, chainId);

    return brandedToken.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          const newBalance = balance.plus(bigAmount);
          oThis.setBalanceInCache(chainId, brandedTokenAddress, owner, newBalance);
        }
        return response;
      });
  },

  /**
   * Debit balance in cache
   *
   * @param {string} chainId - chain id
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitBalance: function (chainId, brandedTokenAddress, owner, bigAmount) {

    const oThis = this;

    // first get branded
    const brandedToken = new Token(brandedTokenAddress, chainId);

    return brandedToken.getBalanceOf(owner)
      .then(function (response) {
        if (response.isSuccess()) {
          const balance = new BigNumber(response.data.balance);
          // may be we should add a check if this goes negetive or may be not.
          const newBalance = balance.minus(bigAmount);
          oThis.setBalanceInCache(chainId, brandedTokenAddress, owner, newBalance);
        }
        return response;
      });
  },

  /**
   * Set balance in cache
   *
   * @param {string} chainId - chain id
   * @param {string} brandedTokenAddress - branded token address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  setBalanceInCache: function (chainId, brandedTokenAddress, owner, bigAmount) {

    const balanceCache = new BalanceCache(chainId, brandedTokenAddress);
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
   * @param {string} chainId - chain id
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be credited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  creditAirdropBalance: function (chainId, airdropContractAddress, owner, bigAmount) {

    const oThis = this;

    const params = {
      userAddresses: [owner],
      chainId: chainId,
      airdropContractAddress: airdropContractAddress
    };
    const userAirdropDetailCache = new UserAirdropDetailCacheKlass(params);
    return userAirdropDetailCache.fetch()
      .then(function (response) {
        if (response.isSuccess()) {
          // calculate the new balance
          oThis.updateAirdropDetail(chainId, airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
      });
  },

  /**
   * Debit airdrop balance in cache
   *
   * @param {string} chainId - chain id
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be debited
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  debitAirdropBalance: function (chainId, airdropContractAddress, owner, bigAmount) {

    const oThis = this;

    const params = {
      userAddresses: [owner],
      chainId: chainId,
      airdropContractAddress: airdropContractAddress
    };
    const userAirdropDetailCache = new UserAirdropDetailCacheKlass(params);
    return userAirdropDetailCache.fetch()
      .then(function (response) {
        if (response.isSuccess()) {
          // calculate the new balance
          oThis.updateAirdropDetail(chainId, airdropContractAddress, owner, newBalance);
        }
        return responseHelper.error('l_cm_th_dab_1', response);
      });
  },

  //TODO: Discuss and change accordingly
  /**
   * update airdrop detail for the user address
   *
   * @param {string} chainId - chain id
   * @param {string} airdropContractAddress - airdrop contract address
   * @param {string} owner - Account address
   * @param {BigNumber} bigAmount - amount to be set
   *
   * @return {promise<result>}
   *
   * @ignore
   */
  updateAirdropDetail: function (chainId, airdropContractAddress, owner, bigAmount) {

    const userAirdropDetailModel = new UserAirdropDetailModelKlass();
    return userAirdropDetailModel.updateAirdropUsedAmount(
      owner,
      bigAmount
    );
  }
};
