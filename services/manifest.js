"use strict";

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = ".."

  , deployer = require(rootPrefix + '/services/deploy/deployer')

  , register = require(rootPrefix + '/services/airdrop_management/register')
  , transfer = require(rootPrefix + '/services/airdrop_management/transfer')
  , approve = require(rootPrefix + '/services/airdrop_management/approve')
  , batchAllocator = require(rootPrefix + '/services/airdrop_management/batch_allocator')
  , userBalance = require(rootPrefix + '/services/airdrop_management/user_balance')

  , workers = require(rootPrefix + '/lib/contract_interact/workers')
  , airdrop = require(rootPrefix + '/lib/contract_interact/airdrop')
  , opsManaged = require(rootPrefix + "/lib/contract_interact/ops_managed_contract")
;

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function() {};

ServiceManifestKlass.prototype = {
  /**
   * deploy any contract
   *
   * @constant {object}
   */
  deploy: {
    deployer: deployer
  },

  /**
   * airdrop Manager
   *
   * @constant {object}
   */
  airdropManager: {
    registerAirdrop: register,
    transfer: transfer,
    approve: approve,
    batchAllocator: batchAllocator,
    userBalance: userBalance
  },

  /**
   * Contract Interact related services
   *
   * @constant {object}
   */
  contractInteract: {
    workers: workers,
    airdrop: airdrop,
    opsManaged:opsManaged
  },

};

module.exports = new ServiceManifestKlass();