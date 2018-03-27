"use strict";

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = ".."

  //, deployWorkers = require(rootPrefix + '/services/deploy/workers')
  //, deployAirdrop = require(rootPrefix + '/services/deploy/airdrop')

  , register = require(rootPrefix + '/services/airdrop_management/register')
  , transfer = require(rootPrefix + '/services/airdrop_management/transfer')
  , approve = require(rootPrefix + '/services/airdrop_management/approve')
  , batchAllocator = require(rootPrefix + '/services/airdrop_management/batch_allocator')
  , userBalance = require(rootPrefix + '/services/airdrop_management/user_balance')

  , setWorker = require(rootPrefix + '/services/workers/set_worker')
  , isWorker = require(rootPrefix + '/services/workers/is_worker')

  , pay = require(rootPrefix + '/services/airdrop/pay')

  , getOps = require(rootPrefix + "/services/ops_managed/get_ops")
  , setOps = require(rootPrefix + "/services/ops_managed/set_ops")
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
    //workers: deployWorkers,
    //airdrop: deployAirdrop
  },

  /**
   * Ops Managed related services
   *
   * @constant {object}
   */
  opsManaged: {
    getOps: getOps,
    setOps: setOps
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
   * workers
   *
   * @constant {object}
   */
  workers: {
    setWorker: setWorker,
    isWorker: isWorker
  },

  /**
   * airdrop
   *
   * @constant {object}
   */
  airdrop: {
    pay: pay
  }

};

module.exports = new ServiceManifestKlass();