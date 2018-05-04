"use strict";

/**
 *
 * This class would be used for calculating user airdrop balance.<br><br>
 *
 * @module services/airdrop_management/user_balance
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , userAirdropDetailCacheKlass = require(rootPrefix + '/lib/cache_multi_management/user_airdrop_detail')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of userBalance
 *
 * @constructor
 *
 * @param {object} params -
 * @param {number} chain_id - chain Id
 * @param {string} airdrop_contract_address - airdrop contract address
 * @param {array} user_addresses - Array of user addressed
 *
 * @return {object}
 *
 */
const AirdropUserBalanceKlass = function(params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======user_balance.params=======");
  logger.debug(params);

  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.chainId = params.chain_id;
  oThis.userAddresses = params.user_addresses;

  oThis.airdropRecord = null;

};

AirdropUserBalanceKlass.prototype = {

  /**
   * Perform method
   *
   * @return {promise<result>}
   *
   */
  perform: async function () {

    const oThis = this;

    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("=======userBalance.validateParams.result=======");
      logger.debug(r);
      if(r.isFailure()) return r;

      r = await oThis.getUserAirdropBalance();
      logger.debug("=======userBalance.getUserAirdropBalance.result=======");
      logger.debug(r);
      return r;
    } catch(err) {
      let errorParams = {
        internal_error_identifier: 's_am_ub_perform_1',
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
   * @return {promise<result>}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        let errorParams = {
          internal_error_identifier: 's_am_ub_validateParams_1',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_ub_validateParams_2',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['chain_id_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      // if address already present
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        let errorParams = {
          internal_error_identifier: 's_am_ub_validateParams_3',
          api_error_identifier: 'invalid_api_params',
          error_config: errorConfig,
          params_error_identifiers: ['airdrop_contract_address_invalid'],
          debug_options: {}
        };
        return onResolve(responseHelper.paramValidationError(errorParams));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        let errorParams = {
          internal_error_identifier: 's_am_ub_validateParams_4',
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
  getUserAirdropBalance: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {
      try {
        const userAirdropDetailCacheKlassObject =  new userAirdropDetailCacheKlass({
          chainId: oThis.chainId,
          airdropId: oThis.airdropRecord.id,
          userAddresses: oThis.userAddresses
        });
        return onResolve(await userAirdropDetailCacheKlassObject.fetch());
      } catch(err){
        let errorParams = {
          internal_error_identifier: 'l_am_ub_getUserAirdropBalance_4',
          api_error_identifier: 'get_balance_failed',
          error_config: errorConfig,
          debug_options: { err: err }
        };
        return onResolve(responseHelper.error(errorParams));
      }
    });

  }

};

module.exports = AirdropUserBalanceKlass;

