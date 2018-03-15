"use strict";

const rootPrefix = '../..'
    , baseCache = require(rootPrefix + '/lib/cache_management/base')
    , AirdropModelKlass = require(rootPrefix + '/app/models/airdrop')
    , responseHelper = require(rootPrefix + '/lib/formatter/response')
;

/**
 * constructor
 *
 * @param {object} cache get/set related arguments
 * @constructor
 *
 */
const AirdropModelCacheKlass = function(params) {

  const oThis = this;

  baseCache.call(oThis, params);

  oThis.useObject = true;

};

AirdropModelCacheKlass.prototype = Object.create(baseCache.prototype);

const AirdropModelCacheKlassPrototype = {

  /**
   * set cache key
   *
   * @return {String}
   */
  setCacheKey: function() {

    const oThis = this;

    oThis.cacheKey = oThis._cacheKeyPrefix() + "all_airdrop";

    return oThis.cacheKey;

  },

  /**
   * set cache expiry in oThis.cacheExpiry and return it
   *
   * @return {Number}
   */
  setCacheExpiry: function() {

    const oThis = this;

    oThis.cacheExpiry = 86400; // 24 hours ;

    return oThis.cacheExpiry;

  },

  /**
   * Fetch data from source
   *
   * @return {Result}
   */
  fetchDataFromSource: function() {

    const oThis = this;

    return new Promise(async function(onResolve, onReject){

      const airdropModelObject = new AirdropModelKlass()
        , allAirdropResponse = await airdropModelObject.getAll()
      ;

      var formattedAirdropDetails = {};
      for (var index in allAirdropResponse) {
        const airdropRecord = allAirdropResponse[index];
        formattedAirdropDetails[airdropRecord.contract_address] = {id: airdropRecord.id};
      }

      return onResolve(responseHelper.successWithData(formattedAirdropDetails));

    });

  }

};

Object.assign(AirdropModelCacheKlass.prototype, AirdropModelCacheKlassPrototype);

module.exports = AirdropModelCacheKlass;