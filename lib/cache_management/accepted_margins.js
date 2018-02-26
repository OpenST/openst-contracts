//"use strict";

/**
 *
 * This is cache layer for accepted margin caching<br><br>
 *
 * @module lib/cache_management/accpeted_margin_cache
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
 * @param {string} address - address of airdrop / pricer contract
 *
 * @constructor
 */
const AcceptedMarginCache = module.exports= function(chainId, contractAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.contractAddress = contractAddress;
};

AcceptedMarginCache.prototype = {

  chainId: null,
  contractAddress: null,

  /**
   * Get cache key
   *
   * @return string
   *
   */
  getCacheKey: function() {
    const oThis = this;
    return `${oThis.chainId}_${oThis.contractAddress}`;
  },

  /**
   * Get airdrop balance from cache
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getAcceptedMargins: function (owner) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey();
    return cacheImplementer.get(cacheKey);
  },

  /**
   * Set airdrop balance to cache
   *
   * @param {BigNumber} balance - airdrop balance of the user
   *
   * @return {promise<result>}
   *
   */
  setAcceptedMargins: function (margin) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey();
    return cacheImplementer.set(cacheKey, margin.toString(10));
  }

};
