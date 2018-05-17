"use strict";

const rootPrefix = '../..'
  , baseCache = require(rootPrefix + '/lib/cache_multi_management/base')
  , UserAirdropDetailKlass = require(rootPrefix + '/app/models/user_airdrop_detail')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * @constructor
 * @augments userAirdropDetailCache
 *
 * @param {Object} params - cache key generation & expiry related params
 *
 */
const userAirdropDetailCache = module.exports = function (params) {
  logger.debug("===========cacheManagement.user_airdrop_details.params===============");
  logger.debug(params);
  const oThis = this;
  oThis.userAddresses = params['userAddresses'];
  oThis.chainId = params['chainId'];
  oThis.airdropId = params['airdropId'];

  baseCache.call(this, params);

  oThis.useObject = true;

};

userAirdropDetailCache.prototype = Object.create(baseCache.prototype);

userAirdropDetailCache.prototype.constructor = userAirdropDetailCache;

/**
 * fetch data from source
 *
 * @return {Result}
 */
userAirdropDetailCache.prototype.fetchDataFromSource = async function (cacheIds) {
  const oThis = this;
  logger.debug("===========cacheManagement.user_airdrop_details.fetchDataFromSource.cacheIds===============");
  logger.debug(cacheIds);
  if (!cacheIds) {

    let errorParams = {
      internal_error_identifier: 'l_cm_uad_1',
      api_error_identifier: 'user_address_invalid',
      error_config: errorConfig,
      debug_options: {}
    };
    return responseHelper.error(errorParams);
  }

  logger.debug("===========cacheManagement.user_airdrop_details.callingFromDB===============");
  const userAirdropDetailModel = new UserAirdropDetailKlass();
  const queryResponse = await userAirdropDetailModel.getByUserAddresses(oThis.airdropId, cacheIds);

  if (queryResponse.isSuccess()) {
    return queryResponse;
  } else {

    let errorParams = {
      internal_error_identifier: 'l_cm_uad_2',
      api_error_identifier: 'data_not_found',
      error_config: errorConfig,
      debug_options: {}
    };

    return responseHelper.error(errorParams);
  }

};

/**
 * set cache key
 *
 * @return {Object}
 */
userAirdropDetailCache.prototype.setCacheKeys = function () {

  const oThis = this;

  oThis.cacheKeys = {};
  for (var i = 0; i < oThis.userAddresses.length; i++) {
    const key = oThis.getCacheKey(oThis.userAddresses[i]);
    oThis.cacheKeys[key] = oThis.userAddresses[i];
  }

  return oThis.cacheKeys;

};

/**
 * set cache expiry in oThis.cacheExpiry and return it
 *
 * @return {Number}
 */
userAirdropDetailCache.prototype.setCacheExpiry = function () {

  const oThis = this;

  oThis.cacheExpiry = 300 // 5 minutes ;

  return oThis.cacheExpiry;

};


/**
 * Get cache keys
 *
 * @param {string} address - address
 *
 * @return {string}
 *
 */
userAirdropDetailCache.prototype.getCacheKey = function(address) {
  const oThis = this;
  return `{${oThis.chainId}_${oThis.airdropId}}_${address.toLowerCase()}`;
};

