//"use strict";

/**
 *
 * This is cache layer for pricer balance related caching<br><br>
 *
 * @module lib/cache_management/pricer_cache
 *
 */
const cacheModule = require('@openstfoundation/openst-cache')
  , cacheImplementer = cacheModule.cache
  , openSTCacheKeys = cacheModule.OpenSTCacheKeys
;

/**
 * constructor
 *
 * @param {string} chainId - Chain id
 * @param {string} contractAddress - address of pricer/airdrop contract
 *
 * @constructor
 */
const PricerCache = module.exports= function(chainId, contractAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.contractAddress = contractAddress;
};

const CONVERSION_RATE_KEY = PricerCache.CONVERSION_RATE_KEY = "conversion_rate"
  , CONVERSION_RATE_DECIMALS_KEY = PricerCache.CONVERSION_RATE_DECIMALS_KEY = "conversion_rate_decimals"
  , DECIMALS_KEY = PricerCache.DECIMALS_KEY = "decimals"
  , BRANDED_TOKEN_ADDRESS = PricerCache.BRANDED_TOKEN_ADDRESS = "branded_token_address"
  , ACCEPTED_MARGINS = PricerCache.ACCEPTED_MARGINS = "accepted_margins"
  , PRICE_ORACLE_ADDRESS = PricerCache.PRICE_ORACLE_ADDRESS = "price_oracle_address"
  ;

PricerCache.prototype = {

  chainId: null,
  contractAddress: null,

  /**
   * Get conversion rate for pricer
   *
   * @param {string} owner - address of user whose balance is to be found
   *
   * @return {promise<result>}
   *
   */
  getCacheKey: function(key) {
    const oThis = this;
    return `${oThis.chainId}_${oThis.contractAddress}_${key}`;
  },

  /**
   * Get cached value
   *
   * @param {string} key - key
   *
   * @return {promise<result>}
   *
   */
  getCacheValue: function(cacheKey) {
    const oThis = this;
    return cacheImplementer.get(cacheKey);
  },

  /**
   * Set value in cache
   *
   * @param {string} key - key
   * @param {string} value - value
   *
   * @return {promise<result>}
   *
   */
  setCacheValue: function (cacheKey, cacheValue) {

    const oThis = this;
    return cacheImplementer.set(cacheKey, cacheValue);
  },

  /**
   * Clear cache for given key
   *
   * @param {string} key - cache key
   *
   * @return {promise<result>}
   *
   */
  clearCache: function (key) {
    return cacheImplementer.del(key);
  },

  /**
   * Get conversion rate for pricer
   *
   * @return {promise<result>}
   *
   */
  getConversionRate: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_KEY);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set conversion rate to cache
   *
   * @param {BigNumber} conversionRate - conversion rate of pricer/airdrop
   *
   * @return {promise<result>}
   *
   */
  setConversionRate: function (conversionRate) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_KEY);
    return oThis.setCacheValue(cacheKey, conversionRate.toString(10));
  },


  /**
   * Clear conversion rate from cache
   *
   * @return {promise<result>}
   *
   */
  clearConversionRate: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_KEY);
    return oThis.clearCache(cacheKey);
  },

  /**
   * Get conversion rate decimals for pricer
   *
   * @return {promise<result>}
   *
   */
  getConversionRateDecimals: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_DECIMALS_KEY);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set conversion rate decimals to cache
   *
   * @param {BigNumber} conversionRateDecimals - conversion rate of pricer/airdrop
   *
   * @return {promise<result>}
   *
   */
  setConversionRateDecimals: function (conversionRateDecimals) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_DECIMALS_KEY);
    return oThis.setCacheValue(cacheKey, conversionRateDecimals.toString(10));
  },

  /**
   * Clear conversion rate decimals from cache
   *
   * @return {promise<result>}
   *
   */
  clearConversionRateDecimals: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_DECIMALS_KEY);
    return oThis.clearCache(cacheKey);
  },

  /**
   * Get decimals for pricer
   *
   * @return {promise<result>}
   *
   */
  getDecimals: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(DECIMALS_KEY);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set decimals to cache
   *
   * @param {BigNumber} conversionRateDecimals - conversion rate of pricer/airdrop
   *
   * @return {promise<result>}
   *
   */
  setDecimals: function (decimals) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(DECIMALS_KEY);
    return oThis.setCacheValue(cacheKey, decimals.toString(10));
  },

  /**
   * clear decimals from cache
   *
   * @return {promise<result>}
   *
   */
  clearDecimals: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(DECIMALS_KEY);
    return oThis.clearCache(cacheKey);
  },


  /**
   * Get branded token address for pricer
   *
   * @return {promise<result>}
   *
   */
  getBrandedTokenAddress: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(BRANDED_TOKEN_ADDRESS);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set branded token address for pricer
   *
   * @param {string} brandedTokenAddress - branded token address
   *
   * @return {promise<result>}
   *
   */
  setBrandedTokenAddress: function (brandedTokenAddress) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(BRANDED_TOKEN_ADDRESS);
    return oThis.setCacheValue(cacheKey, brandedTokenAddress);
  },

  /**
   * clear branded token address cache
   *
   * @param {string} brandedTokenAddress - branded token address
   *
   * @return {promise<result>}
   *
   */
  clearBrandedTokenAddress: function (brandedTokenAddress) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(BRANDED_TOKEN_ADDRESS);
    return oThis.clearCache(cacheKey);
  },

  /**
   * Get accepted margin
   *
   * @param {string} currency - currency
   * @return {promise<result>}
   *
   */
  getAcceptedMargins: function (currency) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${ACCEPTED_MARGINS}`);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set accepted margin
   *
   * @param {string} currency - currency
   * @param {BigNumber} margin - accepted margin value
   *
   * @return {promise<result>}
   *
   */
  setAcceptedMargins: function (currency, margin) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${ACCEPTED_MARGINS}`);
    return oThis.setCacheValue(cacheKey, margin.toString(10));
  },

  /**
   * reset accepted margin cache
   *
   * @param {string} currency - currency
   *
   * @return {promise<result>}
   *
   */
  clearAcceptedMargins: function (currency) {
    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${ACCEPTED_MARGINS}`);
    return oThis.clearCache(cacheKey);
  },


  /**
   * Get price point of price oracle from cache
   *
   * @param {string} address - price oracle address
   * @return {promise<result>}
   *
   */
  getPricePoint: function (address) {

    const oThis = this;
    const cacheKey = openSTCacheKeys.oraclePricePoint(oThis.chainId, address);
    return oThis.getCacheValue(cacheKey);
  },

  /**
   * Set price point of price oracle from cache
   *
   * @param {string} pricePoint - price oracle price point
   * @param {string} address - price oracle address
   * @return {promise<result>}
   *
   */
  setPricePoint: function (address, pricePoint) {

    const oThis = this;
    const cacheKey = openSTCacheKeys.oraclePricePoint(oThis.chainId, address);
    return oThis.setCacheValue(cacheKey, pricePoint);
  },

  /**
   * Clear price point of price oracle from cache
   *
   * @param {string} address - price oracle address
   * @return {promise<result>}
   *
   */
  clearPricePoint: function (address) {

    const oThis = this;
    const cacheKey = openSTCacheKeys.oraclePricePoint(oThis.chainId, address);
    return oThis.clearCache(cacheKey);
  },


  /**
   * Get price oracle address for given currency from cache
   *
   * @param {string} currency - currency
   * @return {promise<result>}
   *
   */
  getPriceOracles: function (currency) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${PRICE_ORACLE_ADDRESS}`);
    return oThis.getCacheValue(cacheKey);
  },


  /**
   * Set price oracle address for given currency in cache
   *
   * @param {string} currency - currency
   * @param {string} address - price oracle address
   * @return {promise<result>}
   *
   */
  setPriceOracles: function (currency, address) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${PRICE_ORACLE_ADDRESS}`);
    return oThis.setCacheValue(cacheKey, address);
  },


  /**
   * Clear price oracle address for given currency in cache
   *
   * @param {string} currency - currency
   * @param {string} address - price oracle address
   * @return {promise<result>}
   *
   */
  clearPriceOracles: function (currency) {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(`${currency}_${PRICE_ORACLE_ADDRESS}`);
    return oThis.clearCache(cacheKey);
  }

};
