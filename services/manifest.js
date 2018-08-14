'use strict';

/**
 * Service manifest
 *
 * @module services/manifest
 */

const rootPrefix = '..',
  InstanceComposer = require(rootPrefix + '/instance_composer');

// deploy related services
require(rootPrefix + '/services/deploy/workers');
require(rootPrefix + '/services/deploy/airdrop');

// ops_managed related services
require(rootPrefix + '/services/ops_managed/get_ops');
require(rootPrefix + '/services/ops_managed/set_ops');

// Workers related services
require(rootPrefix + '/services/workers/set_worker');
require(rootPrefix + '/services/workers/is_worker');
require(rootPrefix + '/lib/set_worker_and_ops');

// airdropManager related services
require(rootPrefix + '/services/airdrop_management/approve');
require(rootPrefix + '/services/airdrop_management/batch_allocator');
require(rootPrefix + '/services/airdrop_management/pay');
require(rootPrefix + '/services/airdrop_management/post_airdrop_pay');
require(rootPrefix + '/services/airdrop_management/register');
require(rootPrefix + '/services/airdrop_management/set_accepted_margin');
require(rootPrefix + '/services/airdrop_management/set_price_oracle');
require(rootPrefix + '/services/airdrop_management/transfer');
require(rootPrefix + '/services/airdrop_management/user_balance');

/**
 * Service Manifest Constructor
 *
 * @constructor
 */
const ServiceManifestKlass = function(configStrategy, instanceComposer) {
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
  workers.setWorkerAndOps = instanceComposer.getSetWorkerOpsClass();

  /**
   * airdropManager services
   **/
  let airdropManager = (oThis.airdropManager = {});
  airdropManager.approve = instanceComposer.getApproveForAirdropClass();
  airdropManager.batchAllocator = instanceComposer.getAirdropBatchAllocatorClass();
  airdropManager.pay = instanceComposer.getPayClass();
  airdropManager.postAirdropPay = instanceComposer.getPostPayClass();
  airdropManager.registerAirdrop = instanceComposer.getRegisterAirdropClass();
  airdropManager.setAcceptedMargin = instanceComposer.getSetAcceptedMarginClass();
  airdropManager.setPriceOracle = instanceComposer.getSetPriceOracleClass();
  airdropManager.transfer = instanceComposer.getTransferClass();
  airdropManager.userBalance = instanceComposer.getAirdropUserBalanceClass();
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

InstanceComposer.register(ServiceManifestKlass, 'getServiceManifest', true);

module.exports = ServiceManifestKlass;
