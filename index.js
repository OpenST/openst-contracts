"use strict";

/**
 * Index File of "@openstfoundation/openst-payments" node module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , opsManaged = require(rootPrefix + "/lib/contract_interact/ops_managed_contract")
  , airdropManagerKlass = require(rootPrefix + "/lib/airdrop_management/base")
  , serviceManifest = require(rootPrefix + '/services/manifest')
;

const OSTPayment = function () {
  const oThis = this;

  oThis.version = version;
  oThis.opsManaged = opsManaged;
  oThis.workers = workers;
  oThis.airdrop = airdrop;
  oThis.airdropManager = airdropManagerKlass;

  oThis.services = serviceManifest;
};

module.exports = new OSTPayment();