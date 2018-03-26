"use strict";

/**
 * Set Worker Contract and OPS Address
 *
 * @module lib/set_worker_and_ops
 */
const rootPrefix = ".."
  , OpsManagedContract = require(rootPrefix + "/lib/contract_interact/ops_managed_contract")
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , Deployer = require(rootPrefix + '/services/deploy/deployer')
  , returnTypes = require(rootPrefix + "/lib/global_constant/return_types")
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
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

    const contractName = 'workers'
      , gasPrice = (options || {}).gasPrice
      , chainId = (options || {}).chainId
      , constructorArgs = []
      , deployOptions = {returnType: returnTypes.transactionReceipt()}
      ;
    const deployerInstance = new Deployer({
      contract_name: contractName,
      constructor_args: constructorArgs,
      gas_price: gasPrice,
      options: deployOptions});

    if(!gasPrice || !chainId){
      return Promise.resolve(responseHelper.error("l_swao_2", "Gas price and Chain Id are mandatory"));
    }

    const deployResult =  await deployerInstance.perform();

    if (deployResult.isSuccess()) {
      const contractAddress = deployResult.data.transaction_receipt.contractAddress;
      logger.win("contractAddress: ", contractAddress);

      logger.debug("Setting Ops Address to: ", opsAddress);
      const setOpsOptions = {
          returnType: returnTypes.transactionReceipt(),
          tag: ''
        }
        , opsManaged = new OpsManagedContract(contractAddress, gasPrice, chainId)
      ;
      var result = await opsManaged.setOpsAddress(deployerAddress,
        deployerPassphrase,
        opsAddress,
        setOpsOptions);
      logger.debug(result);
      var contractOpsAddress = await opsManaged.getOpsAddress();
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

