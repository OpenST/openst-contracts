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
  , setAcceptedMargin = require(rootPrefix + '/services/airdrop_management/set_accepted_margin')
  , setPriceOracle = require(rootPrefix + '/services/airdrop_management/set_price_oracle')
  , transfer = require(rootPrefix + '/services/airdrop_management/transfer')
  , approve = require(rootPrefix + '/services/airdrop_management/approve')
  , batchAllocator = require(rootPrefix + '/services/airdrop_management/batch_allocator')
  , userBalance = require(rootPrefix + '/services/airdrop_management/user_balance')
  , pay = require(rootPrefix + '/services/airdrop_management/pay')

  , setWorker = require(rootPrefix + '/services/workers/set_worker')
  , isWorker = require(rootPrefix + '/services/workers/is_worker')

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
    deployer: deployer
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
   * workers
   *
   * @constant {object}
   */
  workers: {
    setWorker: setWorker,
    isWorker: isWorker
  },

  /**
   * airdrop Manager
   *
   * @constant {object}
   */
  airdropManager: {
    registerAirdrop: register,
    setPriceOracle: setPriceOracle,
    setAcceptedMargin: setAcceptedMargin,
    transfer: transfer,
    approve: approve,
    batchAllocator: batchAllocator,
    userBalance: userBalance,
    pay: pay
  },

};

module.exports = new ServiceManifestKlass();