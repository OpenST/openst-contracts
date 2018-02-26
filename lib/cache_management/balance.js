//"use strict";

/**
 *
 * This is cache layer for balance related caching<br><br>
 *
 * @module lib/cache_management/balance_cache
 *
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , cacheModule = require('@openstfoundation/openst-cache')
  , cacheImplementer = cacheModule.cache
  , cacheKeys = cacheModule.OpenSTCacheKeys
;


/**
 * constructor
 *
 * @param {string} chainId - Chain id
 * @param {string} brandedTokenAddress - address of branded token contract
 *
 * @constructor
 */
const BalanceCache = module.exports= function(chainId, brandedTokenAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.brandedTokenAddress = brandedTokenAddress;
};

BalanceCache.prototype = {

  chainId: null,
  brandedTokenAddress: null,


  /**
   * Get balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getBalance: function (owner) {

    const oThis = this;
    const cacheKey = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner);
    return cacheImplementer.get(cacheKey);
  },

  /**
   * Set balance to cache
   *
   * @param {string} owner - address of user whose balance is to be set
   * @param {BigNumber} balance - balance of the user
   *
   * @return {promise<result>}
   *
   */
  setBalance: function (owner, balance) {

    const oThis = this;
    const cacheKey = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner);
    return cacheImplementer.set(cacheKey, balance.toString(10));
  }

};
