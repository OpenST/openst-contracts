"use strict";

/**
 *
 * This class would be used for deploying airdrop contract.<br><br>
 *
 * @module services/deploy/airdrop
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , DeployerKlass = require(rootPrefix + '/services/deploy/deployer')
  , web3Provider = require(rootPrefix + '/lib/web3/providers/rpc')
  , gasLimitGlobalConstant = require(rootPrefix + '/lib/global_constant/gas_limit')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of airdrop
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.branded_token_contract_address - branded token contract address
 * @param {string} params.base_currency - base currency
 * @param {string} params.worker_contract_address - worker contract address
 * @param {string} params.airdrop_budget_holder - airdrop budget holder address
 * @param {string} params.gas_price - gas price
 * @param {object} params.options - deployment options e.g. {returnType: 'txReceipt'}
 *
 * @return {object}
 *
 */
const DeployAirdropKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======DeployAirdropKlass.params=======");
  logger.debug(params);

  oThis.contractName = 'airdrop';
  oThis.brandedTokenContractAddress = params.branded_token_contract_address;
  oThis.baseCurrency = params.base_currency;
  oThis.workerContractAddress = params.worker_contract_address;
  oThis.airdropBudgetHolder = params.airdrop_budget_holder;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;

  oThis.constructorArgs = [];
};

DeployAirdropKlass.prototype = {

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
      logger.debug("=======DeployAirdropKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.deploy();
      logger.debug("=======DeployAirdropKlass.setOps.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      let errorParams = {
        internal_error_identifier: 's_d_a_perform_1',
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

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.options) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_options'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['branded_token_address_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(oThis.workerContractAddress)) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_worker_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.baseCurrency) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_5',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['base_currency_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(oThis.airdropBudgetHolder)) {
      let errorParams = {
        internal_error_identifier: 's_d_a_validateParams_6',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['airdrop_budget_holder_invalid'],
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
  deploy: function () {
    const oThis = this
    ;
    oThis.constructorArgs = [
      oThis.brandedTokenContractAddress,
      web3Provider.utils.asciiToHex(oThis.baseCurrency),
      oThis.workerContractAddress,
      oThis.airdropBudgetHolder
    ];
    const DeployerObject = new DeployerKlass({
      contract_name: oThis.contractName,
      constructor_args: oThis.constructorArgs,
      gas_price: oThis.gasPrice,
      gas_limit: gasLimitGlobalConstant.deployAirdrop(),
      options: oThis.options
    });
    return DeployerObject.perform();
  }

};

module.exports = DeployAirdropKlass;