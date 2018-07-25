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

};

CacheProviderKlass.prototype = {

  /**
   * get provider
   *
   * @return {object}
   */
  getInstance: function () {
    const oThis = this
      , configStrategy = oThis.ic().configStrategy
    ;
    return OpenStCache.getInstance( configStrategy );
  }

};

InstanceComposer.register(CacheProviderKlass, "getCacheProvider", true);

module.exports = CacheProviderKlass;