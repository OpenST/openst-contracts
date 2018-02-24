//"use strict";

/**
 *
 * This is cache layer for airdrop balance related caching<br><br>
 *
 * @module lib/cache_management/airdrio_cache
 *
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , cacheModule = require('@openstfoundation/openst-cache')
  , cacheImplementer = cacheModule.cache
;


/**
 * constructor
 *
 * @param {string} chainId - Chain id
 * @param {string} airdropAddress - address of airdrop contract
 *
 * @constructor
 */
const AirdropBalanceCache = module.exports= function(chainId, airdropAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.airdropAddress = airdropAddress;
};

AirdropBalanceCache.prototype = {

  chainId: null,
  airdropAddress: null,


  getCacheKey: function(owner) {
    const oThis = this;
    return `${oThis.chainId}_${oThis.airdropAddress}_${owner}`;
  },

  /**
   * Get airdrop balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getBalance: function (owner) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(owner);
    return cacheImplementer.get(cacheKey);
  },

  /**
   * Set airdrop balance to cache
   *
   * @param {string} owner - address of user whose airdrop balance is to be set
   * @param {BigNumber} balance - airdrop balance of the user
   *
   * @return {promise<result>}
   *
   */
  setBalance: function (owner, balance) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(owner);
    return cacheImplementer.set(cacheKey, balance.toString(10));
  }

};
