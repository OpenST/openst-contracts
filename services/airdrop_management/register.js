'use strict';

/**
 *
 * This class would be used for executing airdrop register.<br><br>
 *
 * @module services/airdrop_management/register
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

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/app/models/airdrop');
require(rootPrefix + '/lib/cache_management/airdrop_model');

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @params {object} params -
 * @param {string} params.airdrop_contract_address - airdrop contract address
 * @param {number} params.chain_id - chain Id
 *
 * @return {Object}
 *
 */
const RegisterKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug('=======register.params=======');
  logger.debug(params);

  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.chainId = params.chain_id;
};

RegisterKlass.prototype = {
  /**
   * Perform airdrop register
   *
   * @return {promise}
   */
  perform: function() {
    const oThis = this;

    return oThis.asyncPerform().catch(function(error) {
      if (responseHelper.isCustomResult(error)) {
        return error;
      } else {
        logger.error('openst-platform::services/airdrop_management/register.js::perform::catch');
        logger.error(error);

        return responseHelper.error({
          internal_error_identifier: 's_am_r_perform_1',
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
    logger.debug('=======register.validateParams.result=======');
    logger.debug(r);
    if (r.isFailure()) return r;

    r = await oThis.runRegister();
    logger.debug('=======register.runRegister.result=======');
    logger.debug(r);
    return r;
  },

  /**
   * Validation of params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function() {
    const oThis = this,
      airdropContractInteract = oThis.ic().getAirdropInteractClass(),
      AirdropModelCacheKlass = oThis.ic().getCacheManagementAirdropModelClass();

    return new Promise(async function(onResolve, onReject) {
      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_r_validateParams_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_r_validateParams_2',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['chain_id_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.airdropBudgetHolder();
      const airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(airdropBudgetHolderAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_r_validateParams_3',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({
          useObject: true,
          contractAddress: oThis.airdropContractAddress
        }),
        airdropModelCacheResponse = await airdropModelCacheObject.fetch(),
        airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (airdropRecord) {
        let errorParams = {
          internal_error_identifier: 's_am_r_validateParams_4',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_already_registered'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_r_validateParams_5',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['chain_id_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      return onResolve(responseHelper.successWithData({}));
    });
  },

  /**
   * Run the register
   *
   * @return {promise<result>}
   *
   */
  runRegister: function() {
    const oThis = this,
      airdropKlass = oThis.ic().getAirdropModelKlass(),
      AirdropModelCacheKlass = oThis.ic().getCacheManagementAirdropModelClass();

    return new Promise(async function(onResolve, onReject) {
      try {
        const airdropModelObject = {
          contract_address: oThis.airdropContractAddress
        };
        logger.debug('========register.runRegister.airdropModelObject=======');
        logger.debug(airdropModelObject);
        var airdropModel = new airdropKlass();
        const insertedRecord = await airdropModel.insert(airdropModelObject).fire();
        logger.debug('========register.runRegister.insertedRecord=======');
        logger.debug(insertedRecord);
        const airdropModelCacheObject = new AirdropModelCacheKlass({
          useObject: true,
          contractAddress: oThis.airdropContractAddress
        });
        await airdropModelCacheObject.clear();
        return onResolve(responseHelper.successWithData({ insertId: insertedRecord.insertId }));
      } catch (err) {
        let errorParams = {
          internal_error_identifier: 's_am_r_runRegister_1',
          api_error_identifier: 'unhandled_api_error',
          error_config: errorConfig,
          debug_options: { err: err }
        };
        return onResolve(responseHelper.error(errorParams));
      }
    });
  }
};

InstanceComposer.registerShadowableClass(RegisterKlass, 'getRegisterAirdropClass');

module.exports = RegisterKlass;
