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
;

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

      if (!oThis.decodedEvents) return Promise.resolve(responseHelper.error("s_a_pap_perform_1", "decoded events is mandatory"));

      const validationResponse = helper.validatePostAirdropPayParams(oThis.postAirdropPayParams);
      if (validationResponse.isFailure()) return Promise.resolve(validationResponse);

      return Promise.resolve(await oThis.postAirdropPay());

    } catch (err) {
      logger.error("services/airdrop_management/post_airdrop_pay.js:perform inside catch ", err);
      return Promise.resolve(responseHelper.error('s_a_pap_perform_2', 'Something went wrong. ' + err.message));
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
      logger.error("services/airdrop_management/postAirdropPay.js:perform inside catch ", err);
      return Promise.resolve(responseHelper.error('s_a_pap_postAirdropPay_1', 'Something went wrong. ' + err.message));
    }
  }

};

module.exports = PostPayKlass;