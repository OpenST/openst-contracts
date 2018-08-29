'use strict';

/*
 * Restful API response formatter
 *
 */

const rootPrefix = '../..',
  OSTBase = require('@openstfoundation/openst-base'),
  responseHelper = new OSTBase.responseHelper({
    moduleName: 'openst-payments'
  });

module.exports = responseHelper;
