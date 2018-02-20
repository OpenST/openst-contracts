/**
 * Index File of openst-payments node module
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
;

const OSTPayment = function () {
  const oThis = this;

  oThis.version = version;
  oThis.workers = workers;
  oThis.airdrop = airdrop;
};

module.exports = new OSTPayment();