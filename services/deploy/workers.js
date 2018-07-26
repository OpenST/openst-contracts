'use strict';

/**
 *
 * This class would be used for deploying worker contract.<br><br>
 *
 * @module services/deploy/worker
 *
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/services/deploy/deployer');

/**
 * Constructor to create object of worker
 *
 * @param {object} params -
 * @param {string} params.gas_price - gas price
 * @param {number} params.chain_id - chain id
 * @param {object} params.options - deployment options e.g. {returnType: 'txReceipt'}
 *
 * @constructor
 *
 */
const DeployWorkerKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug('=======DeployWorkerKlass.params=======');
  // Don't log passphrase
  logger.debug(params);

  oThis.contractName = 'workers';
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;

  oThis.constructorArgs = [];
};

DeployWorkerKlass.prototype = {
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
        logger.error('openst-platform::services/deploy/workers.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_d_w_perform_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: basicHelper.fetchErrorConfig(),
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
    logger.debug('=======DeployWorkerKlass.validateParams.result=======');
    logger.debug(r);
    if (r.isFailure()) return r;

    r = await oThis.deploy();
    logger.debug('=======DeployWorkerKlass.setOps.result=======');
    logger.debug(r);

    return r;
  },

  /**
   * Validation of params
   *
   * @return {result}
   *
   */
  validateParams: function() {
    const oThis = this;

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_d_w_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.options) {
      let errorParams = {
        internal_error_identifier: 's_d_w_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_options'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    return responseHelper.successWithData({});
  },

  /**
   * deploy
   *
   * @return {promise<result>}
   *
   */
  deploy: function() {
    const oThis = this,
      DeployerKlass = oThis.ic().getDeployerClass();

    const DeployerObject = new DeployerKlass({
      contract_name: oThis.contractName,
      constructor_args: oThis.constructorArgs,
      gas_price: oThis.gasPrice,
      gas_limit: gasLimitGlobalConstant.deployWorker(),
      options: oThis.options
    });
    return DeployerObject.perform();
  }
};

InstanceComposer.registerShadowableClass(DeployWorkerKlass, 'getWorkerDeployerClass');

module.exports = DeployWorkerKlass;
