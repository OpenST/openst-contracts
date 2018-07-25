"use strict";

/**
 *
 * This class would be used for executing airdrop postAirdropPay.<br><br>
 *
 * @module services/airdrop_management/post_airdrop_pay
 *
 */

const rootPrefix = '../..'
  , InstanceComposer = require( rootPrefix + "/instance_composer")
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

require(rootPrefix + '/lib/contract_interact/airdrop');
require(rootPrefix + '/lib/contract_interact/helper');

/**
 * Constructor to create object of airdrop PostPayKlass
 *
 * @params {object} params -
 * @param {string} params.beneficiaryAddress - beneficiary address
 * @param {string} params.commissionBeneficiaryAddress - commission beneficiary address
 * @param {string} params.spender - spender address
 * @param {string} params.brandedTokenAddress - branded token address
 * @param {string} params.contractAddress - contractAddress address
 * @param {string} params.airdropBudgetHolder - airdrop budget holder address
 * @param {number} params.totalAmount - total amount that was debited from spender account
 * @param {number} params.airdropAmountToUse - airdrop amount that was used in the transaction
 * @param {number} params.chainId - chain id
 * @params {object} decodedEvents - decoded events from receipt
 * @param {number} status - transactions status (0 => failure, 1 => success)
 *
 * @constructor
 *
 */
const PostPayKlass = function (params, decodedEvents, status) {

  const oThis = this;
  params = params || {};

  oThis.postAirdropPayParams = params;
  oThis.decodedEvents = decodedEvents;
  oThis.status = status;

};

PostPayKlass.prototype = {
  /**
   * Perform post airdrop pay
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
          logger.error('openst-platform::services/airdrop_management/post_airdrop_pay.js::perform::catch');
          logger.error(error);
    
          return responseHelper.error({
            internal_error_identifier: 's_am_pap_perform_2',
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
      , helper = oThis.ic().getContractInteractHelper()
    ;

    if (!oThis.decodedEvents) {
      let errorParams = {
        internal_error_identifier: 's_a_pap_perform_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_decoded_events'],
        debug_options: {}
      };
      return Promise.resolve(responseHelper.paramValidationError(errorParams));
    }

    const validationResponse = helper.validatePostAirdropPayParams(oThis.postAirdropPayParams);
    if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

    return oThis.postAirdropPay();

  },


  /**
   * Post airdrop pay
   *
   * @return {promise<result>}
   *
   */
  postAirdropPay: function () {

    const oThis = this
      , AirdropContractInteractKlass = oThis.ic().getAirdropInteractClass()
    ;

    const AirdropContractInteractObject = new AirdropContractInteractKlass(
      oThis.postAirdropPayParams.contractAddress,
      oThis.postAirdropPayParams.chainId
    );
    return AirdropContractInteractObject.postAirdropPay(oThis.postAirdropPayParams, oThis.decodedEvents, oThis.status);
  }

};

InstanceComposer.registerShadowableClass(PostPayKlass, 'getPostPayClass');

module.exports = PostPayKlass;