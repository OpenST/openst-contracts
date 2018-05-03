"use strict";

/**
 *
 * This class would be used for executing getOps.<br><br>
 *
 * @module services/ops_managed/get_ops
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
 * Constructor to create object of get_ops
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.contract_address - contract address
 * @param {string} params.gas_price - gas price
 * @param {object} params.chain_id - chain id
 *
 * @return {object}
 *
 */
const GetOpsKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======GetOpsKlass.params=======");
  logger.debug(params);

  oThis.contractAddress = params.contract_address;
  oThis.chainId = params.chain_id;
  oThis.gasPrice = params.gas_price;

};

GetOpsKlass.prototype = {

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
      logger.debug("=======GetOpsKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.getOps();
      logger.debug("=======GetOpsKlass.getOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      let errorParams = {
        internal_error_identifier: 's_om_go_perform_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: {}
      };
      logger.error(err.message);
      return responseHelper.error(errorParams);
    }

  },

  /**
   * Validation of params
   *
   * @return {promise<result>}
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
   * get Ops
   *
   * @return {promise<result>}
   *
   */
  getOps: function () {
    const oThis = this
    ;

    const OpsManagedContractInteractObject = new OpsManagedContractInteractKlass(
      oThis.contractAddress,
      oThis.gasPrice,
      oThis.chainId
    );
    return OpsManagedContractInteractObject.getOpsAddress();
  }

};

module.exports = GetOpsKlass;