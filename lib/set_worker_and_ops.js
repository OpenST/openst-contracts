"use strict";

/**
 * Set Worker Contract and OPS Address
 *
 * @module lib/set_worker_and_ops
 */
const rootPrefix = ".."
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , returnTypes = require(rootPrefix + "/lib/global_constant/return_types")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , openstPayment = require(rootPrefix + '/index')
  , SetOpsKlass = openstPayment.services.opsManaged.setOps
  , GetOpsKlass = openstPayment.services.opsManaged.getOps
  , DeployWorkersKlass = openstPayment.services.deploy.workers
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

// Different addresses used for deployment
const deployerName = "deployer"
  , opsName = "ops"
;

require(rootPrefix + '/config/core_addresses');

/**
 * Set Worker Contract and OPS Address
 *
 * @constructor
 */
const SetWorkerOps = function(){

};

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

    const oThis = this
      , coreAddresses = oThis.ic().getCoreAddresses()
      , opsAddress = coreAddresses.getAddressForUser(opsName)
      , deployerAddress = coreAddresses.getAddressForUser(deployerName)
      , deployerPassphrase = coreAddresses.getPassphraseForUser(deployerName)
    ;
    
    const gasPrice = (options || {}).gasPrice
      , chainId = (options || {}).chainId
      , deployOptions = {returnType: returnTypes.transactionReceipt()}
      ;

    if(!gasPrice || !chainId){
      let errorParams = {
        internal_error_identifier: 'l_swao_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid', 'chain_id_invalid'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
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

    let errorParams = {
      internal_error_identifier: 'l_swao_1',
      api_error_identifier: 'unhandled_api_error',
      error_config: errorConfig,
      debug_options: {}
    };

    return Promise.resolve(responseHelper.error(errorParams));
  }

};

InstanceComposer.registerShadowableClass(SetOpsKlass, 'getSetWorkerOpsClass');

module.exports = SetWorkerOps;

