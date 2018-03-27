"use strict";

/**
 *
 * This class would be used for executing worker is_worker.<br><br>
 *
 * @module services/airdrop_management/set_accepted_margin
 *
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , AirdropContractInteractKlass = require(rootPrefix + '/lib/contract_interact/airdrop')
  , BigNumber = require('bignumber.js')
;

/**
 * Constructor to create object of SetAcceptedMarginKlass
 *
 * @constructor
 *
 * @param {string} airdrop_contract_address - airdrop contract address
 * @param {string} chain_id - chain id
 * @param {string} sender_address - address of sender
 * @param {string} sender_passphrase - passphrase of sender
 * @param {string} currency - quote currency
 * @param {BigNumber} accepted_margin - accepted margin for the given currency (in wei)
 * @param {BigNumber} gas_price - gas price
 * @param {object} options - for params like returnType, tag.
 *
 * @return {Object}
 *
 */
const SetAcceptedMarginKlass = function (params) {
  logger.debug("=======SetAcceptedMarginKlass.params=======");
  // Don't log passphrase
  logger.debug(params.airdrop_contract_address, params.chain_id, params.sender_address, params.currency,
    params.accepted_margin, params.gas_price, params.options);

  const oThis = this
  ;
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.chainId = params.chain_id;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.currency = params.currency;
  oThis.acceptedMargin = params.accepted_margin;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;
};

SetAcceptedMarginKlass.prototype = {

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
      logger.debug("=======SetAcceptedMarginKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.setAcceptedMargin();
      logger.debug("=======SetAcceptedMarginKlass.setAcceptedMargin.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_w_sam_perform_1', 'Something went wrong. ' + err.message);
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
    if (!helper.isValidCurrency(oThis.currency, false)) {
      return responseHelper.error('s_am_sam_validateParams_1', 'currency is mandatory');
    }

    if (!oThis.gasPrice) {
      return responseHelper.error('s_am_sam_validateParams_2', 'gas price is mandatory');
    }

    const acceptedMargin = new BigNumber(oThis.acceptedMargin);

    if (acceptedMargin.isNaN() || !acceptedMargin.isInteger() || acceptedMargin.lt(0)) {
      return responseHelper.error('s_am_sam_validateParams_3', 'accepted margin cannot be negative');
    }

    if (!basicHelper.isAddressValid(oThis.senderAddress)) {
      return responseHelper.error('s_am_sam_validateParams_4', 'address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * set accepted margin value in airdrop contract
   *
   * @return {promise<result>}
   *
   */
  setAcceptedMargin: function () {
    const oThis = this
    ;
    const AirdropContractInteractObject = new AirdropContractInteractKlass(
      oThis.airdropContractAddress,
      oThis.chainId
    );
    return AirdropContractInteractObject.setAcceptedMargin(
      oThis.senderAddress,
      oThis.senderPassphrase,
      oThis.currency,
      oThis.acceptedMargin,
      oThis.gasPrice,
      oThis.options
    );
  }

};

module.exports = SetAcceptedMarginKlass;