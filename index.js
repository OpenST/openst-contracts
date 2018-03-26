"use strict";

/**
 * Index File of "@openstfoundation/openst-payments" node module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , serviceManifest = require(rootPrefix + '/services/manifest')
;

const OSTPayment = function () {
  const oThis = this;

  oThis.version = version;

  oThis.services = serviceManifest;
};

module.exports = new OSTPayment();