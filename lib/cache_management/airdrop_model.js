"use strict";

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
  /**
   Note: baseCache is a special case here. AirdropModelCacheKlass is derived from it.
   Hence, dont worry, you dont need to use oThis.ic().getCacheManagementBaseKlass()
   **/
  , baseCache = require(rootPrefix + '/lib/cache_management/base')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

require(rootPrefix + '/lib/cache_management/base');
require(rootPrefix + '/app/models/airdrop');

/**
 * constructor
 *
 * @param {object} cache get/set related arguments
 * @constructor
 *
 */
const AirdropModelCacheKlass = function (params) {

  const oThis = this
  ;

  oThis.contractAddress = params.contractAddress;
  baseCache.call(oThis, params);

};

AirdropModelCacheKlass.prototype = Object.create(baseCache.prototype);

const AirdropModelCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function () {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "airdrop_" + oThis.contractAddress.toLowerCase();

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function () {

    const oThis = this;

    oThis.cacheExpiry = 86400; // 24 hours ;

    return oThis.cacheExpiry;

  },

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: function () {

    const oThis = this
      , AirdropModelKlass = oThis.ic().getAirdropModelKlass()
    ;

    return new Promise(async function (onResolve, onReject) {

      const airdropModelObject = new AirdropModelKlass()
        , airdropResponse = await airdropModelObject.getByContractAddress(oThis.contractAddress)
        , airdropRecord = airdropResponse[0]
      ;

      // Return null if airdrop record not found
      if (!airdropRecord) {
        return onResolve(responseHelper.successWithData({id: 0}));
      }

      var formattedAirdropDetails = {};
      formattedAirdropDetails[airdropRecord.contract_address] = {id: airdropRecord.id};

      return onResolve(responseHelper.successWithData(formattedAirdropDetails));

    });

  }

};

Object.assign(AirdropModelCacheKlass.prototype, AirdropModelCacheKlassPrototype);

InstanceComposer.registerShadowableClass(AirdropModelCacheKlass, "getCacheManagementAirdropModelClass");

module.exports = AirdropModelCacheKlass;