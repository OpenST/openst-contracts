'use strict';

/**
 *
 * This class would be used for executing worker is_worker.<br><br>
 *
 * @module services/workers/is_worker
 *
 */

const rootPrefix = '../..',
  InstanceComposer = require(rootPrefix + '/instance_composer'),
  responseHelper = require(rootPrefix + '/lib/formatter/response'),
  basicHelper = require(rootPrefix + '/helpers/basic_helper'),
  logger = require(rootPrefix + '/helpers/custom_console_logger'),
  paramErrorConfig = require(rootPrefix + '/config/param_error_config'),
  apiErrorConfig = require(rootPrefix + '/config/api_error_config');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/lib/contract_interact/workers');

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @params {object} params -
 * @param {string} params.workers_contract_address - contract address of workers
 * @param {string} params.worker_address - worker address
 * @param {object} params.chain_id - chain id
 *
 * @return {Object}
 *
 */
const IsWorkerKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug('=======IsWorkerKlass.params=======');
  logger.debug(params);

  oThis.workersContractAddress = params.workers_contract_address;
  oThis.workerAddress = params.worker_address;
  oThis.chainId = params.chain_id;
};

IsWorkerKlass.prototype = {
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
        logger.error('openst-platform::services/workers/is_worker.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_w_iw_perform_1',
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
    logger.debug('=======IsWorkerKlass.validateParams.result=======');
    logger.debug(r);
    if (r.isFailure()) return r;

    r = await oThis.isWorker();
    logger.debug('=======IsWorkerKlass.setWorker.result=======');
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
    if (!basicHelper.isAddressValid(oThis.workerAddress)) {
      let errorParams = {
        internal_error_identifier: 's_w_iw_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_worker_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      let errorParams = {
        internal_error_identifier: 's_w_iw_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['chain_id_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    return responseHelper.successWithData({});
  },

  /**
   * is Worker
   *
   * @return {promise<result>}
   *
   */
  isWorker: function() {
    const oThis = this,
      WorkersContractInteractKlass = oThis.ic().getWorkersInteractClass();

    const workersContractInteractObject = new WorkersContractInteractKlass(oThis.workersContractAddress, oThis.chainId);

    return workersContractInteractObject.isWorker(oThis.workerAddress);
  }
};

InstanceComposer.registerShadowableClass(IsWorkerKlass, 'getIsWorkerClass');

module.exports = IsWorkerKlass;
