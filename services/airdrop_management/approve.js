"use strict";

/**
 *
 * This is a utility file which would be used for executing approve by airdrop budget holder.<br><br>
 *
 * @module services/airdrop_management/approve
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

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/lib/contract_interact/branded_token');
require(rootPrefix + '/lib/cache_management/airdrop_model');

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of approve
 *
 * @constructor
 *
 * @param {object} params -
 * @param {string} params.airdrop_contract_address - airdrop contract address
 * @param {string} params.airdrop_budget_holder_passphrase - airdropBudgetHolder Passphrase
 * @param {string} params.gas_price - gas price
 * @param {number} params.chain_id - chain Id
 * @param {object} params.options - options
 *
 * @return {object}
 *
 */
const ApproveKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug("=========Approve.params=========");
  // Don't log passphrase
  logger.debug(params.airdrop_contract_address, params.gas_price, params.chain_id, params.options);
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.airdropBudgetHolderPassphrase = params.airdrop_budget_holder_passphrase;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.options = params.options;

  oThis.airdropBudgetHolder = null;
  oThis.brandedTokenContractAddress = null;
  oThis.amount = null;
  oThis.brandedTokenObject = null;
};

ApproveKlass.prototype = {
  
  /**
   * Perform approve by airdrop budget holder to contract
   *
   * @return {promise}
   *
   */
  perform: function () {
    const oThis = this;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/airdrop_management/approve.js::perform::catch');
          logger.error(error);
    
          return responseHelper.error({
            internal_error_identifier: 's_am_a_perform_1',
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

    const oThis = this;
  
    var r = null;
    r = await oThis.validateParams();
    logger.debug("\n=========Approve.validateParams.result=========");
    logger.debug(r);
    if(r.isFailure()) return r;
  
    r = oThis.doApprove();
    logger.debug("\n=========Approve.doApprove.result=========");
    logger.debug(r);
    return r;
    
  },

  /**
   * Validate params
   *
   * @return {promise<result>}
   *
   */
  validateParams: function(){

    const oThis = this
      , airdropContractInteract = oThis.ic().getAirdropInteractClass()
      , brandedTokenContractInteract = oThis.ic().getBrandedTokenInteractClass()
      , AirdropModelCacheKlass = oThis.ic().getCacheManagementAirdropModelClass()
    ;

    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
       ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_2',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['unregistered_airdrop_contract'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      var airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_3',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['branded_token_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.airdropBudgetHolderAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_4',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_budget_holder_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      oThis.brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      //result = await oThis.brandedTokenObject.getBalanceOf(oThis.airdropBudgetHolderAddress);
      oThis.amount = '250000000000000000000000'; //result.data.balance;
      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_5',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_amount'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_6',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['invalid_chain_id'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!oThis.gasPrice) {
        let errorParams = {
          internal_error_identifier: 's_am_a_validateParams_7',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['gas_price_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Perform Approve to airdrop budget holder
   *
   * @return {promise<result>}
   *
   */
  doApprove: async function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      // Approve to budget holder
      const approveByBudgetHolderResponse = await oThis.brandedTokenObject.approveByBudgetHolder(oThis.airdropBudgetHolderAddress,
        oThis.airdropBudgetHolderPassphrase,
        oThis.airdropContractAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      logger.debug("\n=========Transfer.doApprove.response=========");
      logger.debug(approveByBudgetHolderResponse);
      return onResolve(approveByBudgetHolderResponse);
    });

  }

};

InstanceComposer.registerShadowableClass(ApproveKlass, 'getApproveForAirdropClass');

module.exports = ApproveKlass;