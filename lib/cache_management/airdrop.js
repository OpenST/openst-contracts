//"use strict";

/**
 *
 * This is cache layer for airdrop balance related caching<br><br>
 *
 * @module lib/cache_management/airdrop_cache
 *
 */
const rootPrefix = '../..'
  , PricerCacheKlass = require(rootPrefix + '/lib/cache_management/pricer');
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
  PricerCacheKlass.call(oThis, chainId, airdropAddress);
};

AirdropBalanceCache.prototype = Object.create(PricerCacheKlass.prototype);

/*
const CONVERSION_RATE_KEY = PricerCache.CONVERSION_RATE_KEY = "conversion_rate"
  , BRANDED_TOKEN_ADDRESS = PricerCache.BRANDED_TOKEN_ADDRESS = "branded_token_address"
  ;
*/
const AIR_DROP_BUDGET_HOLDER = "airdrop_budget_holder";

const AirdropBalanceCachePrototype = {

  /**
   * Get airdrop budger holder address
   *
   * @return {promise<result>}
   *
   */
  getAirdropBudgetHolder: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER);
    return oThis.getCacheValue(cacheKey);
  },


  /**
   * Set airdrop bugdet holder address
   *
   * @param {string} address - airdrop budget holder address
   * @return {promise<result>}
   *
   */
  setAirdropBudgetHolder: function (address) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER);
    return oThis.setCacheValue(cacheKey, address);
  },


  /**
   * Clear airdrop budget holder address
   *
   * @return {promise<result>}
   *
   */
  clearPriceOracles: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER);
    return oThis.clearCache(cacheKey);
  }


};

Object.assign(AirdropBalanceCache.prototype, AirdropBalanceCachePrototype);
