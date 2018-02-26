//"use strict";

/**
 *
 * This is cache layer for pricer balance related caching<br><br>
 *
 * @module lib/cache_management/pricer_cache
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
 * @param {string} contractAddress - address of pricer/airdrop contract
 *
 * @constructor
 */
const PricerCache = module.exports= function(chainId, contractAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.contractAddress = contractAddress;
};

const CONVERSION_RATE_KEY = "conversion_rate"
  , CONVERSION_RATE_DECIMALS_KEY = "conversion_rate_decimals"
  , DECIMALS_KEY = "decimals"
  , BRANDED_TOKEN_ADDRESS = "branded_token_address"
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
   * Get conversion rate for pricer
   *
   * @return {promise<result>}
   *
   */
  getConversionRate: function () {

    const oThis = this;
    const cacheKey = oThis.getCacheKey(CONVERSION_RATE_KEY);
    return cacheImplementer.get(cacheKey);
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
    return cacheImplementer.set(cacheKey, conversionRate.toString(10));
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
    return cacheImplementer.get(cacheKey);
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
    return cacheImplementer.set(cacheKey, conversionRateDecimals.toString(10));
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
    return cacheImplementer.get(cacheKey);
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
    return cacheImplementer.set(cacheKey, decimals.toString(10));
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
    return cacheImplementer.get(cacheKey);
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
    return cacheImplementer.set(cacheKey, brandedTokenAddress);
  }

};
