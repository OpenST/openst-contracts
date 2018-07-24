"use strict";

/**
 * OpenStCache Provider
 *
 * @module lib/providers/cache
 */

const OpenStCache = require('@openstfoundation/openst-cache')
;

const rootPrefix = '../..'
  , InstanceComposer = require(rootPrefix + "/instance_composer")
;

/**
 * Constructor
 *
 * @constructor
 */
const CacheProviderKlass = function (configStrategy, instanceComposer) {

  const oThis = this;

  return oThis.getInstance(instanceComposer);

};

CacheProviderKlass.prototype = {

  /**
   * get provider
   *
   * @return {object}
   */
  getInstance: function (instanceComposer) {
    return OpenStCache.getInstance( instanceComposer.configStrategy );
  }

};

InstanceComposer.register(CacheProviderKlass, "getCacheProvider", true);

module.exports = CacheProviderKlass;