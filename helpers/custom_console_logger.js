"use strict";

/*
 * Custom Console log methods.
 *
 */
const OSTCore = require('@openstfoundation/openst-core')
  , Logger  = OSTCore.Logger
;

const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , loggerLevel = coreConstants.DEBUG_ENABLED == 1 ? Logger.LOG_LEVELS.TRACE : Logger.LOG_LEVELS.INFO
;

module.exports = new Logger("openst-payments", loggerLevel);
