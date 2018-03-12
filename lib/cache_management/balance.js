//"use strict";

/**
 *
 * This is cache layer for balance related caching<br><br>
 *
 * @module lib/cache_management/balance_cache
 *
 */
const openStCache = require('@openstfoundation/openst-cache')
;

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , coreConstants = require(rootPrefix + '/config/core_constants')
;

const cacheImplementer = new openStCache.cache(coreConstants.CACHING_ENGINE, true)
  , cacheKeys = openStCache.OpenSTCacheKeys
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
    const oThis = this
      , cacheKey = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner)
    ;

    //logger.info('getBalance called with params:', JSON.stringify({owner: owner, cacheKey: cacheKey}));

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
    const oThis = this
      , cacheKey = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner)
    ;

    // logger.info('setBalance called with params:', JSON.stringify({owner: owner, balance: balance.toString(10),
    //   cacheKey: cacheKey}));

    return cacheImplementer.set(cacheKey, balance.toString(10));
  },

  /**
   * Clear balance from cache
   *
   * @param {string} owner - address of user whose balance is to be set
   *
   * @return {promise<result>}
   *
   */
  clearBalance: function(owner) {
    const oThis = this;
    const cacheKey = cacheKeys.btBalance(oThis.chainId, oThis.brandedTokenAddress, owner);
    return cacheImplementer.del(cacheKey);
  }

};
