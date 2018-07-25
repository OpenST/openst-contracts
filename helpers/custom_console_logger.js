"use strict";

/*
 * Custom Console log methods.
 *
 */
const OSTBase = require('@openstfoundation/openst-base')
  , Logger  = OSTBase.Logger
;

const loggerLevel = process.env.OST_DEBUG_ENABLED == '1' ? Logger.LOG_LEVELS.TRACE : Logger.LOG_LEVELS.INFO
;

module.exports = new Logger("openst-payments", loggerLevel);
