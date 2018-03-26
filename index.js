"use strict";

/**
 * Index File of "@openstfoundation/openst-payments" node module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , deployer = require(rootPrefix + '/services/deployer')
  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , opsManaged = require(rootPrefix + "/lib/contract_interact/ops_managed_contract")
  , airdropManagerKlass = require(rootPrefix + "/lib/airdrop_management/base")
;

const OSTPayment = function () {
  const oThis = this;

  oThis.version = version;
  oThis.deployer = deployer;
  oThis.opsManaged = opsManaged;
  oThis.workers = workers;
  oThis.airdrop = airdrop;
  oThis.airdropManager = airdropManagerKlass;
};

module.exports = new OSTPayment();