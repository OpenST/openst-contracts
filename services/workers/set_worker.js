"use strict";

/**
 *
 * This class would be used for executing airdrop register.<br><br>
 *
 * @module services/workers/set_worker
 *
 */

const BigNumber = require('bignumber.js')
;

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

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
 * @param {object} params -
 * @param {string} params.workers_contract_address - contract address of workers
 * @param {string} params.sender_address - address of sender
 * @param {string} params.sender_passphrase - passphrase of sender
 * @param {string} params.worker_address - worker address
 * @param {number} params.deactivation_height - block number till which the worker is valid
 * @param {bignumber} params.gas_price - gas price
 * @param {number} params.chain_id - chain id
 * @param {object} params.options - for params like returnType, tag.
 *
 * @return {object}
 *
 */
const SetWorkerKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======SetWorkerKlass.params=======");
  // Don't log passphrase
  logger.debug(params.workers_contract_address, params.sender_address, params.worker_address, params.deactivation_height, params.gas_price, params.chain_id, params.options);

  oThis.workersContractAddress = params.workers_contract_address;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.workerAddress = params.worker_address;
  oThis.deactivationHeight = params.deactivation_height;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.options = params.options

};

SetWorkerKlass.prototype = {
  
  /**
   * Perform
   *
   * @return {promise}
   */
  perform: function () {
    const oThis = this
    ;
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/workers/set_worker.js::perform::catch');
          logger.error(error);
          
          return responseHelper.error({
            internal_error_identifier: 's_w_sw_perform_1',
            api_error_identifier: 'unhandled_api_error',
            error_config: basicHelper.fetchErrorConfig(),
            debug_options: {err: error}
          });
        }
      });
  },
  
  /**
   * Async Perform
   *
   * @return {promise<result>}
   */
  asyncPerform: async function () {
    const oThis = this
    ;
  
    var r = null;
  
    r = await oThis.validateParams();
    logger.debug("=======SetWorkerKlass.validateParams.result=======");
    logger.debug(r);
    if (r.isFailure()) return r;
  
    r = await oThis.setWorker();
    logger.debug("=======SetWorkerKlass.setWorker.result=======");
    logger.debug(r);
  
    return r;
  },

  /**
   * Validation of params
   *
   * @return {result}
   *
   */
  validateParams: function () {
    const oThis = this;
    if (!basicHelper.isAddressValid(oThis.workersContractAddress)) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_worker_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    if (!basicHelper.isAddressValid(oThis.senderAddress)) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    if (!basicHelper.isAddressValid(oThis.workerAddress)) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_worker_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    if (!oThis.deactivationHeight) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_5',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['deactivation_height_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }
    const deactivationHeight = new BigNumber(oThis.deactivationHeight);
    if (deactivationHeight.isNaN() || deactivationHeight.lt(0) || !deactivationHeight.isInteger()) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_6',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['deactivation_height_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_7',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      let errorParams = {
        internal_error_identifier: 's_w_sw_validateParams_8',
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
   * Set Worker
   *
   * @return {promise<result>}
   *
   */
  setWorker: function () {

    const oThis = this
      , WorkersContractInteractKlass = oThis.ic().getWorkersInteractClass()
    ;

    const workersContractInteractObject = new WorkersContractInteractKlass(
      oThis.workersContractAddress,
      oThis.chainId
    );
    return workersContractInteractObject.setWorker(
      oThis.senderAddress,
      oThis.senderPassphrase,
      oThis.workerAddress,
      oThis.deactivationHeight.toString(10),
      oThis.gasPrice,
      oThis.options
    );
  }

};

InstanceComposer.registerShadowableClass(SetWorkerKlass, 'getSetWorkerClass');

module.exports = SetWorkerKlass;