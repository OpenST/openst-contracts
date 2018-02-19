/**
 * Index File of openst-payments node module
 */

"use strict";

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , pricer = require(rootPrefix + '/lib/contract_interact/pricer')
  , aidrop = require(rootPrefix + '/lib/contract_interact/aidrop')
;

const OSTPayment = function () {
  const oThis = this;

  oThis.version = version;
  oThis.workers = workers;
  oThis.pricer = pricer;
  oThis.airdrop = airdrop;
};

module.exports = new OSTPayment();