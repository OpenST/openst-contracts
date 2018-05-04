"use strict";

/**
 *
 * This class would be used for executing setOps.<br><br>
 *
 * @module services/ops_managed/set_ops
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , OpsManagedContractInteractKlass = require(rootPrefix + '/lib/contract_interact/ops_managed_contract')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of set_ops
 *
 * @constructor
 *
 * @params {object} params -
 * @param {string} params.contract_address - contract address
 * @param {string} params.gas_price - gas price
 * @param {number} params.chain_id - chain id
 * @param {string} params.deployer_address - deployer address
 * @param {string} params.deployer_passphrase - deployer passphrase
 * @param {string} params.ops_address - ops addresses
 * @param {object} params.options - options
 *
 * @return {object}
 *
 */
const SetOpsKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======GetOpsKlass.params=======");
  // Don't log passphrase
  logger.debug(params.contract_address, params.gas_price, params.chain_id, params.deployer_address, params.ops_address, params.options);

  oThis.contractAddress = params.contract_address;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.deployerAddress = params.deployer_address;
  oThis.deployerPassphrase = params.deployer_passphrase;
  oThis.opsAddress = params.ops_address;
  oThis.options = params.options;

};

SetOpsKlass.prototype = {

  /**
   * Perform method
   *
   * @return {promise<result>}
   *
   */
  perform: async function () {
    const oThis = this
    ;
    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("=======SetOpsKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.setOps();
      logger.debug("=======SetOpsKlass.setOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      let errorParams = {
        internal_error_identifier: 's_om_go_perform_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: { err: err }
      };
      return responseHelper.error(errorParams);
    }

  },

  /**
   * Validation of params
   *
   * @return {result}
   *
   */
  validateParams: function () {
    const oThis = this
    ;
    if (!basicHelper.isAddressValid(oThis.contractAddress)) {
      let errorParams = {
        internal_error_identifier: 's_om_go_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_contract_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_om_go_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      let errorParams = {
        internal_error_identifier: 's_om_go_validateParams_3',
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
   * set Ops
   *
   * @return {promise<result>}
   *
   */
  setOps: function () {
    const oThis = this
    ;

    const OpsManagedContractInteractObject = new OpsManagedContractInteractKlass(
      oThis.contractAddress,
      oThis.gasPrice,
      oThis.chainId
    );
    return OpsManagedContractInteractObject.setOpsAddress(
      oThis.deployerAddress,
      oThis.deployerPassphrase,
      oThis.opsAddress,
      oThis.options
    );
  }

};

module.exports = SetOpsKlass;