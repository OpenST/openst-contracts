"use strict";

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = ".."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
;

// deploy related services
require(rootPrefix + '/services/deploy/workers');
require(rootPrefix + '/services/deploy/airdrop');

// ops_managed related services
require(rootPrefix + "/services/ops_managed/get_ops");
require(rootPrefix + "/services/ops_managed/set_ops");

// Workers related services
require(rootPrefix + '/services/workers/set_worker');
require(rootPrefix + '/services/workers/is_worker');

  //
  // , register = require(rootPrefix + '/services/airdrop_management/register')
  // , setAcceptedMargin = require(rootPrefix + '/services/airdrop_management/set_accepted_margin')
  // , setPriceOracle = require(rootPrefix + '/services/airdrop_management/set_price_oracle')
  // , transfer = require(rootPrefix + '/services/airdrop_management/transfer')
  // , approve = require(rootPrefix + '/services/airdrop_management/approve')
  // , batchAllocator = require(rootPrefix + '/services/airdrop_management/batch_allocator')
  // , userBalance = require(rootPrefix + '/services/airdrop_management/user_balance')
  // , pay = require(rootPrefix + '/services/airdrop_management/pay')
  // , postAirdropPay =  require(rootPrefix + '/services/airdrop_management/post_airdrop_pay')
  //
  

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function (configStrategy, instanceComposer) {

  const oThis = this;
  
  /**
   * deploy services
   **/
  let deploy = (oThis.deploy = {});
  deploy.workers = instanceComposer.getWorkerDeployerClass();
  deploy.airdrop = instanceComposer.getAirdropDeployerClass();
  
  /**
   * opsManaged services
   **/
  let opsManaged = (oThis.opsManaged = {});
  opsManaged.setOps = instanceComposer.getSetOpsClass();
  opsManaged.getOps = instanceComposer.getOpsClass();

  /**
   * workers services
   **/
  let workers = (oThis.workers = {});
  workers.setWorker = instanceComposer.getSetWorkerClass();
  workers.isWorker = instanceComposer.getIsWorkerClass();

};

ServiceManifestKlass.prototype = {
  
  // /**
  //  * deploy any contract
  //  *
  //  * @constant {object}
  //  */
  // deploy: {
  //   workers: deployWorkers,
  //   airdrop: deployAirdrop
  // },
  //
  // /**
  //  * Ops Managed related services
  //  *
  //  * @constant {object}
  //  */
  // opsManaged: {
  //   getOps: getOps,
  //   setOps: setOps
  // },
  //
  // /**
  //  * workers
  //  *
  //  * @constant {object}
  //  */
  // workers: {
  //   setWorker: setWorker,
  //   isWorker: isWorker
  // },
  //
  // /**
  //  * airdrop Manager
  //  *
  //  * @constant {object}
  //  */
  // airdropManager: {
  //   registerAirdrop: register,
  //   setPriceOracle: setPriceOracle,
  //   setAcceptedMargin: setAcceptedMargin,
  //   transfer: transfer,
  //   approve: approve,
  //   batchAllocator: batchAllocator,
  //   userBalance: userBalance,
  //   pay: pay,
  //   postAirdropPay: postAirdropPay
  // },

};

InstanceComposer.register(ServiceManifestKlass, "getServiceManifest", true);

module.exports = ServiceManifestKlass;