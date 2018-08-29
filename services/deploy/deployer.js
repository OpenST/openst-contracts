'use strict';

/**
 * This is script for deploying any contract.<br><br>
 *
 * @module services/deploy/deployer
 */

const uuid = require('uuid');

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  deployerName = 'deployer',
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/lib/providers/web3_factory');
require(rootPrefix + '/config/core_addresses');

/**
 * Constructor to create object of deployer
 *
 * @params {object} params -
 * @param {string} params.contract_name - name of contract
 * @param {object} params.constructor_args - contract deployment constructor arguments
 * @param {string} params.gas_price - gas price
 * @param {string} params.gas_limit - gas limit
 * @param {object} params.options - deployment options
 *
 * @constructor
 *
 */
const DeployerKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug('\n=========deployer params=========');
  logger.debug(params);

  oThis.contractName = params.contract_name;
  oThis.constructorArgs = params.constructor_args;
  oThis.gasPrice = params.gas_price;
  oThis.gasLimit = params.gas_limit || gasLimitGlobalConstant.default();
  oThis.options = params.options;
};

DeployerKlass.prototype = {
  /**
   * Perform
   *
   * @return {promise}
   */
  perform: function() {
    const oThis = this;
    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/deploy/deployer.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_d_d_perform_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: { err: error }
        });
      }
    });
  },

  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function() {
    const oThis = this;

    var r = null;

    r = await oThis.validateParams();
    logger.debug('\n=========Deployer.validateParams.result=========');
    logger.debug(r);
    if (r.isFailure()) return r;

    r = oThis.deploy();
    logger.debug('\n=========Deployer.deploy.result=========');
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
    const oThis = this,
      coreAddresses = oThis.ic().getCoreAddresses();

    if (!oThis.contractName) {
      logger.error('Error: Contract name is mandatory');
      let errorParams = {
        internal_error_identifier: 's_d_d_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['contract_name_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_d_d_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      logger.error('%Error - Gas price is mandatory');
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasLimit) {
      let errorParams = {
        internal_error_identifier: 's_d_d_validateParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_limit_invalid'],
        debug_options: {}
      };
      logger.error('%Error - Gas limit is mandatory');
      return responseHelper.paramValidationError(errorParams);
    }

    const deployerAddress = coreAddresses.getAddressForUser(deployerName);
    if (!deployerAddress) {
      let errorParams = {
        internal_error_identifier: 's_d_d_validateParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['deployer_invalid'],
        debug_options: {}
      };
      logger.error('%Error - Deployer address is invalid');
      return responseHelper.paramValidationError(errorParams);
    }

    const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);
    if (!deployerAddrPassphrase) {
      let errorParams = {
        internal_error_identifier: 's_d_d_validateParams_5',
        api_error_identifier: 'invalid_deployer_passphrase',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error('Error: Deployer passphrase is invalid');
      return responseHelper.error(errorParams);
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
    const oThis = this,
      web3ProviderFactory = oThis.ic().getWeb3ProviderFactory(),
      coreAddresses = oThis.ic().getCoreAddresses(),
      web3Provider = web3ProviderFactory.getProvider(web3ProviderFactory.typeWS);

    return new Promise(function(onResolve, onReject) {
      logger.debug('Contract name: ' + oThis.contractName);
      logger.debug('Gas price: ' + oThis.gasPrice);
      logger.debug('Constructor arguments: ' + oThis.constructorArgs);

      const txUUID = uuid.v4();
      const returnType = basicHelper.getReturnType(oThis.options.returnType);

      const asyncPerform = function() {
        const deployerAddress = coreAddresses.getAddressForUser(deployerName);
        const deployerAddrPassphrase = coreAddresses.getPassphraseForUser(deployerName);

        const contractAbi = coreAddresses.getAbiForContract(oThis.contractName);
        const contractBin = coreAddresses.getBinForContract(oThis.contractName);

        const txParams = {
          from: deployerAddress,
          data: (web3Provider.utils.isHexStrict(contractBin) ? '' : '0x') + contractBin,
          gasPrice: oThis.gasPrice,
          gas: oThis.gasLimit
        };

        if (oThis.constructorArgs) {
          txParams.arguments = oThis.constructorArgs;
        }

        var contract = new web3Provider.eth.Contract(contractAbi, null, txParams);

        // this is needed since the contract object
        //contract.setProvider(web3Provider.currentProvider);

        // Unlock account
        web3Provider.eth.personal
          .unlockAccount(deployerAddress, deployerAddrPassphrase)
          .then(function() {
            const encodeABI = contract.deploy(txParams).encodeABI();
            txParams.data = encodeABI;

            web3Provider.eth
              .sendTransaction(txParams)
              .on('transactionHash', function(transactionHash) {
                logger.debug(`Transaction hash received for ${txUUID} :${transactionHash}`);
                if (basicHelper.isReturnTypeTxHash(returnType)) {
                  return onResolve(
                    responseHelper.successWithData({
                      transaction_uuid: txUUID,
                      transaction_hash: transactionHash,
                      transaction_receipt: {}
                    })
                  );
                }
              })
              .once('receipt', function(receipt) {
                const contractAddress = receipt.contractAddress;
                web3Provider.eth
                  .getCode(contractAddress)
                  .then(function(code) {
                    if (code.length <= 2) {
                      if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                        let errorParams = {
                          internal_error_identifier: 's_d_d_deploy_1',
                          api_error_identifier: 'contract_deploy_failed',
                          error_config: errorConfig,
                          debug_options: {}
                        };
                        return onResolve(responseHelper.error(errorParams));
                      }
                    } else if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      logger.debug(`Contract deployment success: ${txUUID}`);
                      return onResolve(
                        responseHelper.successWithData({
                          transaction_uuid: txUUID,
                          transaction_hash: receipt.transactionHash,
                          transaction_receipt: receipt
                        })
                      );
                    }
                  })
                  .catch(function(reason) {
                    logger.error('%Error - Contract deployment failed. Reason', reason);
                    if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                      let errorParams = {
                        internal_error_identifier: 's_d_d_deploy_2',
                        api_error_identifier: 'unhandled_api_error',
                        error_config: errorConfig,
                        debug_options: {}
                      };
                      return onResolve(responseHelper.error(errorParams));
                    }
                  });
              })
              .catch(function(reason) {
                if (basicHelper.isReturnTypeTxReceipt(returnType)) {
                  logger.error('%Error - Contract deployment failed. Reason: ', reason);
                  let errorParams = {
                    internal_error_identifier: 's_d_d_deploy_3',
                    api_error_identifier: 'unhandled_api_error',
                    error_config: errorConfig,
                    debug_options: {}
                  };
                  return onResolve(responseHelper.error(errorParams));
                }
              });
          })
          .catch(function(reason) {
            let errorParams = {
              internal_error_identifier: 's_d_d_deploy_4',
              api_error_identifier: 'unhandled_api_error',
              error_config: errorConfig,
              debug_options: {}
            };
            logger.error('%Error - Transaction failed. Reason:', reason);
            return onResolve(responseHelper.error(errorParams));
          });
      };
      if (basicHelper.isReturnTypeUUID(returnType)) {
        asyncPerform();
        return onResolve(
          responseHelper.successWithData({
            transaction_uuid: txUUID,
            transaction_hash: '',
            transaction_receipt: {}
          })
        );
      } else {
        return asyncPerform();
      }
    });
  }
};

InstanceComposer.registerShadowableClass(DeployerKlass, 'getDeployerClass');

module.exports = DeployerKlass;
