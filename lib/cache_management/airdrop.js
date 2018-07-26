//"use strict";

/**
 *
 * This is cache layer for airdrop balance related caching<br><br>
 *
 * @module lib/cache_management/airdrop_cache
 *
 */
const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  /**
   Note: PricerCacheKlass is a special case here. AirdropBalanceCache is derived from it.
   Hence, dont worry, you dont need to use oThis.ic().getCacheManagementPricerClass()
   **/
  , PricerCacheKlass = require(rootPrefix + '/lib/cache_management/pricer')
;

const AIR_DROP_BUDGET_HOLDER = "airdrop_budget_holder"
;

/**
 * constructor
 *
 * @param {string} chainId - Chain id
 * @param {string} airdropAddress - address of airdrop contract
 *
 * @augments PricerCacheKlass
 *
 * @constructor
 */
const AirdropBalanceCache = function(chainId, airdropAddress) {
  const oThis = this
  ;

  PricerCacheKlass.call(oThis, chainId, airdropAddress);
};

AirdropBalanceCache.prototype = Object.create(PricerCacheKlass.prototype);

const AirdropBalanceCacheSpecificPrototype = {
  /**
   * Get airdrop budger holder address
   *
   * @return {promise<result>}
   */
  getAirdropBudgetHolder: function () {
    const oThis = this
      , cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER)
    ;

    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set airdrop bugdet holder address
   *
   * @param {string} address - airdrop budget holder address
   *
   * @return {promise<result>}
   */
  setAirdropBudgetHolder: function (address) {
    const oThis = this
      , cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER)
    ;

    return oThis.setCacheValue(cacheKey, address);
  },

  /**
   * Clear airdrop budget holder address
   *
   * @return {promise<result>}
   */
  clearPriceOracles: function () {
    const oThis = this
      , cacheKey = oThis.getCacheKey(AIR_DROP_BUDGET_HOLDER)
    ;

    return oThis.clearCache(cacheKey);
  }
};

Object.assign(AirdropBalanceCache.prototype, AirdropBalanceCacheSpecificPrototype);

InstanceComposer.registerShadowableClass(AirdropBalanceCache, "getCacheManagementAirdropClass");

module.exports = AirdropBalanceCache;