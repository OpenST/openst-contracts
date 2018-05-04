"use strict";

/**
 *
 * This class would be used for executing airdrop postAirdropPay.<br><br>
 *
 * @module services/airdrop_management/post_airdrop_pay
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropContractInteractKlass = require(rootPrefix + '/lib/contract_interact/airdrop')
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

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
   * Perform method
   *
   * @return {promise<result>}
   *
   */
  perform: async function () {
    const oThis = this
    ;

    try {

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

      return Promise.resolve(await oThis.postAirdropPay());

    } catch (err) {
      let errorParams = {
        internal_error_identifier: 's_a_pap_perform_2',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: { err: err }
      };
      logger.error("services/airdrop_management/post_airdrop_pay.js:perform inside catch ", err);
      return Promise.resolve(responseHelper.error(errorParams));
    }

  },


  /**
   * Post airdrop pay
   *
   * @return {promise<result>}
   *
   */
  postAirdropPay: function () {
    const oThis = this
    ;

    try {
      const AirdropContractInteractObject = new AirdropContractInteractKlass(
        oThis.postAirdropPayParams.contractAddress,
        oThis.postAirdropPayParams.chainId
      );
      return AirdropContractInteractObject.postAirdropPay(oThis.postAirdropPayParams, oThis.decodedEvents, oThis.status);
    } catch (err) {
      let errorParams = {
        internal_error_identifier: 's_a_pap_postAirdropPay_1',
        api_error_identifier: 'unhandled_api_error',
        error_config: errorConfig,
        debug_options: { err: err }
      };
      logger.error("services/airdrop_management/postAirdropPay.js:perform inside catch ", err);
      return Promise.resolve(responseHelper.error(errorParams));
    }
  }

};

module.exports = PostPayKlass;