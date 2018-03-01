"use strict";

const rootPrefix = '../..'
  , openStCache = require('@openstfoundation/openst-cache')
  , openStCacheKeys = openStCache.OpenSTCacheKeys
  , cacheImplementer = openStCache.cache
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix+'/helpers/custom_console_logger')
  , utils = require(rootPrefix + '/lib/utils')
;

/**
 * constructor
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 * @constructor
 */
const baseCacheMultiManagementKlass = function(params) {

  const oThis = this;

  if (!params) {
    params = {};
  }

  oThis.params = params;

  oThis.cacheKeys = {};

  // call sub class method to set cache keys using params provided
  oThis.setCacheKeys();

};

baseCacheMultiManagementKlass.prototype = {

  /**
   * Fetch data from cache, in case of cache miss calls sub class method to fetch data from source
   *
   * @return {Promise<Result>} - On success, data.value has value. On failure, error details returned.
   */
  fetch: async function () {

    const oThis = this;

    var data = await oThis._fetchFromCache()
      , fetchDataRsp = null;

    // if there are any cache misses then fetch that data from source.
    if (data['cacheMiss'].length > 0) {

      fetchDataRsp = await oThis.fetchDataFromSource(data['cacheMiss']);

      // if fetch from source failed do not set cache and return error response
      if (fetchDataRsp.isFailure()) {
        logger.notify('l_cm_b_1', 'Something Went Wrong', fetchDataRsp);
        return Promise.resolve(fetchDataRsp);
      } else {
        // DO NOT WAIT for cache being set
        var cacheKeys = Object.keys(fetchDataRsp.data);
        for (var i=0; i<cacheKeys.length; i++) {
          var key = cacheKeys[i];
          var dataToSet = fetchDataRsp.data[key];
          data['cachedData'][key] = dataToSet;
          oThis._setCache(key, dataToSet);
        }
      }

    }

    return Promise.resolve(responseHelper.successWithData(data['cachedData']));

  },

  /**
   * clear cache
   *
   * @return {Promise<Result>}
   */
  clear: function () {

    const oThis = this;

    for (var i=0; i<Object.keys(oThis.cacheKeys).length; i++) {
      var cacheKey = Object.keys(oThis.cacheKeys)[i];
      cacheImplementer.del(cacheKey);
    }

  },

  // methods which sub class would have to implement

  /**
   * set cache keys in oThis.cacheKeys and return it
   *
   * @return {String}
   */
  setCacheKeys: function() {
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
  fetchDataFromSource: async function(cacheIds) {
    throw 'sub class to implement';
  },

  // private methods from here

  /**
   * fetch from cache
   *
   * @return {Object}
   */
  _fetchFromCache: async function () {

    const oThis = this;
    var cacheFetchResponse = null
      , cacheKeys = Object.keys(oThis.cacheKeys);

    cacheFetchResponse = await cacheImplementer.multiGet(cacheKeys);
    var cacheMiss = []
      , cachedResponse = {}
    ;

    if (cacheFetchResponse.isSuccess()) {
      var cachedData = cacheFetchResponse.data.response;
      for (var i = 0; i < cacheKeys.length; i++) {
        var cacheKey = cacheKeys[i];
        if (cachedData[cacheKey]) {
          cachedResponse[oThis.cacheKeys[cacheKey]] = JSON.parse(cachedData[cacheKey]);
        } else {
          cacheMiss.push(oThis.cacheKeys[cacheKey]);
        }
      }
    }

    return {cacheMiss: cacheMiss, cachedData: cachedResponse};
  },

  /**
   * set data in cache.
   *
   * @param {Object} dataToSet - data to set in cache
   *
   * @return {Result}
   */
  _setCache: function (key, dataToSet) {

    const oThis = this;

    var setCacheFunction = function(k, v) {
      var cacheKey = utils.invert(oThis.cacheKeys)[k];
      return cacheImplementer.set(cacheKey, JSON.stringify(v), oThis.cacheExpiry);
    };

    setCacheFunction(key, dataToSet).then(function(cacheSetResponse) {

      if (cacheSetResponse.isFailure()) {
        logger.notify('cmm_b_2', 'Something Went Wrong', cacheSetResponse);
      }
    });

  }

};

module.exports = baseCacheMultiManagementKlass;
