"use strict";

/*
 * Custom Console log methods.
 *
 */
const OSTBase = require('@openstfoundation/openst-base')
  , Logger  = OSTBase.Logger
;

const rootPrefix = '..'
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , loggerLevel = coreConstants.DEBUG_ENABLED == 1 ? Logger.LOG_LEVELS.TRACE : Logger.LOG_LEVELS.INFO
;

module.exports = new Logger("openst-payments", loggerLevel);
