//"use strict";

/**
 *
 * This is cache layer for airdrop balance related caching<br><br>
 *
 * @module lib/cache_management/airdrio_cache
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
 * @param {string} airdropAddress - address of airdrop contract
 *
 * @constructor
 */
const AirdropBalanceCache = module.exports= function(chainId, airdropAddress) {
  const oThis = this;
  oThis.chainId = chainId;
  oThis.airdropAddress = airdropAddress;
};

AirdropBalanceCache.prototype = {

  chainId: null,
  airdropAddress: null,


  getCacheKey: function(owner) {
    const oThis = this;
    return `${oThis.chainId}_${oThis.airdropAddress}_${owner}`;
  },

};
