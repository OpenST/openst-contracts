/**
 *
 * This is a utility file which would be used for executing all methods related to cache for pricer.<br><br>
 *
 * @module lib/contract_interact/cache_helper
 *
 */
const cacheModule = require('@openstfoundation/openst-cache');

const cacheImplementer = cacheModule.cache;


/**
 * Constructor to create object of cacheHelper
 *
 * @constructor
 *
 */
const cacheHelper = module.exports = function(chainId) {
  const oThis = this;
  oThis.chainId = chainId;
};

cacheHelper.prototype = {

  chainId: null,

  /**
   * Get accepted margins from cache
   *
   * @param {string} currency - currency
   * @param {string} contractAddress - contract address
   *
   * @return {promise<result>}
   *
   */
  getAcceptedMarginsFromCache: function (currency, contractAddress) {
    const oThis = this;
    const cacheKey = `${oThis.chainId}_${currency}_${contractAddress}`;
    return cacheImplementer.get(cacheKey);
  },

  /**
   * Set accepted margins to cache
   *
   * @param {string} currency - currency
   * @param {string} contractAddress - contract address
   * @param {number} value - value
   *
   * @return {promise<result>}
   *
   */
  setAcceptedMarginsToCache: function (currency, contractAddress, value) {
    const oThis = this;
    const cacheKey = `${oThis.chainId}_${currency}_${contractAddress}`;
    return cacheImplementer.set(cacheKey, value.toString(10));
  }

};

