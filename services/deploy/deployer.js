"use strict";

/**
 * This is script for deploying any contract.<br><br>
 *
 * @module services/deployer
 */

const uuid = require('uuid')
  , rootPrefix = '..'
  , web3Provider = require(rootPrefix + '/lib/web3/providers/rpc')
  , coreConstants = require(rootPrefix + '/config/core_constants')
  , coreAddresses = require(rootPrefix + '/config/core_addresses')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , deployerName = 'deployer'
;

/**
 * Constructor to create object of deployer
 *
 * @param {String} contract_name - name of contract
 * @param {Object} constructor_args - contract deployment constructor arguments
 * @param {String} gas_price - gas price
 * @param {Object} options - deployment options
 *
 * @constructor
 *
 */
const DeployerKlass = function(params) {
  logger.debug("\n=========deployer params=========");
  logger.debug(params);
  const oThis = this;

  oThis.contractName = params.contract_name;
  oThis.constructorArgs = params.constructor_args;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;
};

DeployerKlass.prototype = {

  /**
   * Perform method
   *
   * @return {promise<result>} - returns a promise which resolves to an object of kind Result
   *
   */
  perform: async function () {

    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    logger.debug("\n=========Deployer.validateParams.result=========");
    logger.debug(r);
    if(r.isFailure()) return r;

    r = oThis.deploy();
    logger.debug("\n=========Deployer.deploy.result=========");
    logger.debug(r);
    return r;

  },

  /**
  * Validate deploy parameters
  *
  * @return {result} - returns object of kind Result
  *
  */
  validateParams: function() {

    const oThis = this;

    if (!oThis.contractName) {
      logger.error("Error: Contract name is mandatory");
      return responseHelper.error('l_d_1', 'Contract name is mandatory');
    }

    if (!oThis.gasPrice) {
      logger.error("Error: Gas price is mandatory");
      return responseHelper.error('l_d_2', 'Gas price is mandatory');
    }

    const deployerAddress = coreAddresses.getAddressForUser(deployerName);
    if (!deployerAddress) {
      logger.error("Error: Deployer address is invalid");
      return responseHelper.error('l_d_3', 'Deployer address is invalid');
    }

    const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);
    if (!deployerAddrPassphrase) {
      logger.error("Error: Deployer passphrase is invalid");
      return responseHelper.error('l_d_4', 'Deployer passphrase is invalid');
    }

    return responseHelper.successWithData({});

  },

  /**
  * Deploy contract
  *
  * @return {promise<result>} - returns a promise which resolves to an object of kind Result
  *
  */
  deploy: function() {

    const oThis = this;

    return new Promise(function (onResolve, onReject) {

      logger.debug("Contract name: " + oThis.contractName);
      logger.debug("Gas price: " + oThis.gasPrice);
      logger.debug("Constructor arguments: " + oThis.constructorArgs);

      const txUUID = uuid.v4();
      const returnType = basicHelper.getReturnType(oThis.options.returnType);

      const asyncPerform = function () {

        const deployerAddress = coreAddresses.getAddressForUser(deployerName);
        const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

        const contractAbi = coreAddresses.getAbiForContract(oThis.contractName);
        const contractBin = coreAddresses.getBinForContract(oThis.contractName);

        const txParams = {
          from: deployerAddress,
          data: (web3Provider.utils.isHexStrict(contractBin) ? "" : "0x") + contractBin,
          gasPrice: oThis.gasPrice,
          gas: coreConstants.OST_GAS_LIMIT
        };

        if (oThis.constructorArgs) {
          txParams.arguments = oThis.constructorArgs;
        }

        var contract = new web3Provider.eth.Contract(
          contractAbi,
          null,
          txParams
        );

        // this is needed since the contract object
        contract.setProvider(web3Provider.currentProvider);

        // Unlock account
        web3Provider.eth.personal.unlockAccount(
          deployerAddress,
          deployerAddrPassphrase)
          .then(function() {
            const encodeABI = contract.deploy(txParams).encodeABI();
            txParams.data = encodeABI;

            web3Provider.eth.sendTransaction(txParams)
              .on('transactionHash', function(transactionHash) {
                logger.debug(`Transaction hash received for ${txUUID} :${transactionHash}`);
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData(
                      {
                        transaction_uuid: txUUID,
                        transaction_hash: transactionHash,
                        transaction_receipt: {}
                      }));
                }
              })
              .on('receipt', function(receipt) {

                const contractAddress = receipt.contractAddress;
                web3Provider.eth.getCode(contractAddress).then(function(code) {
                  if (code.length <= 2) {
                    const errorCode = "l_d_6";
                    logger.error(`${errorCode}: Contract deployment failed`);
                    if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      return onResolve(responseHelper.error(errorCode, 'Contract deployment failed'));
                    }
                  } else if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                    logger.debug(`Contract deployment success: ${txUUID}`);
                    return onResolve(
                      responseHelper.successWithData(
                        {
                          transaction_uuid: txUUID,
                          transaction_hash: receipt.transactionHash,
                          transaction_receipt: receipt
                        }));
                  }
                })
                  .catch(function(reason) {
                    const errorCode = "l_d_7";
                    logger.error(`${errorCode}: Contract deployment failed`);
                    if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      return onResolve(responseHelper.error(errorCode, 'Contract deployment failed'));
                    }
                  });
              });
          })
          .catch(function(reason) {
            const errorCode = "l_d_5";
            logger.error(`${errorCode}: Contract deployment failed`);
            return onResolve(responseHelper.error(errorCode, 'transaction failed'));
          });

      };
      if (basicHelper.isReturnTypeUUID(returnType)) {
        asyncPerform();
        return onResolve(
          responseHelper.successWithData(
            {
              transaction_uuid: txUUID,
              transaction_hash: "",
              transaction_receipt: {}
            }));
      } else {
        return asyncPerform();
      }

    });
  }

};

module.exports = DeployerKlass;

