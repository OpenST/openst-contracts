'use strict';

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger');

require(rootPrefix + '/lib/providers/cache');

/**
 * constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 * @constructor
 */
const baseCacheManagementKlass = function(params) {
  const oThis = this,
    cacheProvider = oThis.ic().getCacheProvider(),
    cacheObj = cacheProvider.getInstance(),
    cacheImplementer = cacheObj.cacheInstance;

  if (!params) {
    params = {};
  }

  oThis.params = params;

  oThis.useObject = params.useObject === true;

  oThis.cacheKey = null;

  oThis.cacheExpiry = null;

  // Set cacheImplementer to perform caching operations
  oThis.cacheImplementer = cacheImplementer;
  // call sub class method to set cache key using params provided
  oThis.setCacheKey();

  // call sub class method to set cache expiry using params provided
  oThis.setCacheExpiry();
};

baseCacheManagementKlass.prototype = {
  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @return {Promise<Result>} - On success, data.value has value. On failure, error details returned.
   */
  fetch: async function() {
    const oThis = this;

    var data = await oThis._fetchFromCache(),
      fetchDataRsp = null;

    // if cache miss call sub class method to fetch data from source and set cache
    if (!data) {
      fetchDataRsp = await oThis.fetchDataFromSource();

      // if fetch from source failed do not set cache and return error response
      if (fetchDataRsp.isFailure()) {
        logger.error('l_cm_b_fetch_1', 'Something Went Wrong', fetchDataRsp);
        return fetchDataRsp;
      } else {
        data = fetchDataRsp.data;
        // DO NOT WAIT for cache being set
        oThis._setCache(data);
      }
    }

    return Promise.resolve(responseHelper.successWithData(data));
  },

  /**
   * clear cache
   *
   * @return {Promise<Result>}
   */
  clear: function() {
    const oThis = this;

    return oThis.cacheImplementer.del(oThis.cacheKey);
  },

  // methods which sub class would have to implement

  /**
   * set cache key in oThis.cacheKey and return it
   *
   * @return {String}
   */
  setCacheKey: function() {
    throw 'sub class to implement';
  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {
    throw 'sub class to implement';
  },

  /**
   * fetch data from source
   * return should be of klass Result
   * data attr of return is returned and set in cache
   *
   * @return {Result}
   */
  fetchDataFromSource: async function() {
    throw 'sub class to implement';
  },

  // private methods from here

  /**
   * fetch from cache
   *
   * @return {Object}
   */
  _fetchFromCache: async function() {
    const oThis = this;
    var cacheFetchResponse = null,
      cacheData = null;

    if (oThis.useObject) {
      cacheFetchResponse = await oThis.cacheImplementer.getObject(oThis.cacheKey);
    } else {
      cacheFetchResponse = await oThis.cacheImplementer.get(oThis.cacheKey);
    }

    if (cacheFetchResponse.isSuccess()) {
      cacheData = cacheFetchResponse.data.response;
    }

    return cacheData;
  },

  /**
   * set data in cache.
   *
   * @param {Object} dataToSet - data to se tin cache
   *
   * @return {Result}
   */
  _setCache: function(dataToSet) {
    const oThis = this;

    var setCacheFunction = function() {
      if (oThis.useObject) {
        return oThis.cacheImplementer.setObject(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
      } else {
        return oThis.cacheImplementer.set(oThis.cacheKey, dataToSet, oThis.cacheExpiry);
      }
    };

    setCacheFunction().then(function(cacheSetResponse) {
      if (cacheSetResponse.isFailure()) {
        logger.notify('l_cm_b_setCache_1', 'Something Went Wrong', cacheSetResponse);
      }
    });
  },

  /**
   * cache key prefix
   *
   * @return {String}
   */
  _cacheKeyPrefix: function() {
    return 'ost_payment_';
  },

  /**
   * Shared cache key prefix
   * This cache is shared between company api and saas
   * Cache keys with these prefixes can be flushed via company api or saas.
   *
   * @return {String}
   */
  _sharedCacheKeyPrefix: function() {
    return 'ost_payment__shared_';
  }
};

InstanceComposer.registerShadowableClass(baseCacheManagementKlass, 'getCacheManagementBaseKlass');

module.exports = baseCacheManagementKlass;
