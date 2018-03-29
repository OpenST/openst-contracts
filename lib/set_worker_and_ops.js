"use strict";

/**
 * Set Worker Contract and OPS Address
 *
 * @module lib/set_worker_and_ops
 */
const rootPrefix = ".."
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Deployer = require(rootPrefix + '/services/deploy/deployer')
  , returnTypes = require(rootPrefix + "/lib/global_constant/return_types")
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , SetOpsKlass = require(rootPrefix + '/services/ops_managed/set_ops')
  , GetOpsKlass = require(rootPrefix + '/services/ops_managed/get_ops')
  , DeployWorkersKlass = require(rootPrefix + '/services/deploy/worker')
  ;

// Different addresses used for deployment
const deployerName = "deployer"
  , deployerAddress = coreAddresses.getAddressForUser(deployerName)
  , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
;

// Set Ops Address
const opsName = "ops"
  , opsAddress = coreAddresses.getAddressForUser(opsName)
;

/**
 * Set Worker Contract and OPS Address
 *
 * @constructor
 */
const SetWorkerOps = function(){};

SetWorkerOps.prototype = {

  /**
   * Set Worker and Ops for a contract.
   *
   * @param {object} [options]
   * @param {number} [options.gasPrice] - Gas Price to use
   * @param {number} [options.chainId] - Chain Id where contract need to be deployed
   *
   * @return {Promise<result>}
   */
  perform: async function(options){

    const gasPrice = (options || {}).gasPrice
      , chainId = (options || {}).chainId
      , deployOptions = {returnType: returnTypes.transactionReceipt()}
      ;

    if(!gasPrice || !chainId){
      return Promise.resolve(responseHelper.error("l_swao_2", "Gas price and Chain Id are mandatory"));
    }
    const DeployWorkerObject = new DeployWorkersKlass({
      gas_price: gasPrice,
      options: deployOptions
    });
    const deployResult =  await DeployWorkerObject.perform();

    if (deployResult.isSuccess()) {
      const contractAddress = deployResult.data.transaction_receipt.contractAddress;
      logger.win("contractAddress: ", contractAddress);

      logger.debug("Setting Ops Address to: ", opsAddress);
      const setOpsOptions = {
          returnType: returnTypes.transactionReceipt(),
          tag: ''
        }
      ;
      const SetOpsObject = new SetOpsKlass({
        contract_address: contractAddress,
        gas_price: gasPrice,
        chain_id: chainId,
        deployer_address: deployerAddress,
        deployer_passphrase: deployerPassphrase,
        ops_address: opsAddress,
        options: setOpsOptions
      });
      var result = await SetOpsObject.perform();
      logger.debug(result);

      const GetOpsObject = new GetOpsKlass({
        contract_address: contractAddress,
        gas_price: gasPrice,
        chain_id: chainId
      });
      const getOpsResult = await GetOpsObject.perform();
      const contractOpsAddress = getOpsResult.data.opsAddress;
      logger.debug("Ops Address Set to: ", contractOpsAddress);
      return Promise.resolve(responseHelper.successWithData({workerContractAddress: contractAddress}));
    } else{
      logger.error("Error deploying contract");
      logger.error(deployResult);
      return Promise.resolve(deployResult);
    }

    return Promise.resolve(responseHelper.error("l_swao_1", "Something went wrong."));
  }

};

module.exports = SetWorkerOps;

