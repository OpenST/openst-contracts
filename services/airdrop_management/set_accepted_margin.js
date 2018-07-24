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
  , paramErrorConfig = require(rootPrefix + '/config/param_error_config')
  , apiErrorConfig = require(rootPrefix + '/config/api_error_config')
;

const errorConfig = {
  param_error_config: paramErrorConfig,
  api_error_config: apiErrorConfig
};

/**
 * Constructor to create object of SetAcceptedMarginKlass
 *
 * @constructor
 *
 * @param {object} - params
 * @param {string} params.airdrop_contract_address - airdrop contract address
 * @param {number} params.chain_id - chain id
 * @param {string} params.sender_address - address of sender
 * @param {string} params.sender_passphrase - passphrase of sender
 * @param {string} params.currency - quote currency
 * @param {bignumber} params.accepted_margin - accepted margin for the given currency (in wei)
 * @param {bignumber} params.gas_price - gas price
 * @param {object} params.options - for params like returnType, tag.
 *
 * @return {Object}
 *
 */
const SetAcceptedMarginKlass = function (params) {
  const oThis = this;
  params = params || {};
  logger.debug("=======SetAcceptedMarginKlass.params=======");
  // Don't log passphrase
  logger.debug(params.airdrop_contract_address, params.chain_id, params.sender_address, params.currency,
    params.accepted_margin, params.gas_price, params.options);

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
   * Perform Set Accepted margins
   *
   * @return {promise}
   */
  perform: function () {
    const oThis = this;
    
    return oThis.asyncPerform()
      .catch(function (error) {
        if (responseHelper.isCustomResult(error)) {
          return error;
        } else {
          logger.error('openst-platform::services/airdrop_management/set_accepted_margin.js::perform::catch');
          logger.error(error);
    
          return responseHelper.error({
            internal_error_identifier: 's_am_sam_perform_1',
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
    ;
    
    var r = null;
  
    r = await oThis.validateParams();
    logger.debug("=======SetAcceptedMarginKlass.validateParams.result=======");
    logger.debug(r);
    if (r.isFailure()) return r;
  
    r = await oThis.setAcceptedMargin();
    logger.debug("=======SetAcceptedMarginKlass.setAcceptedMargin.result=======");
    logger.debug(r);
  
    return r;

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
    if (!helper.isValidCurrency(oThis.currency, false)) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_1',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_currency'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_2',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    const acceptedMargin = new BigNumber(oThis.acceptedMargin);

    if (acceptedMargin.isNaN() || !acceptedMargin.isInteger() || acceptedMargin.lt(0)) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_3',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['accepted_margin_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isAddressValid(oThis.senderAddress)) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_4',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['invalid_sender_address'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!oThis.gasPrice) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_5',
        api_error_identifier: 'invalid_api_params',
        error_config: errorConfig,
        params_error_identifiers: ['gas_price_invalid'],
        debug_options: {}
      };
      return responseHelper.paramValidationError(errorParams);
    }

    if (!basicHelper.isValidChainId(oThis.chainId)) {
      let errorParams = {
        internal_error_identifier: 's_am_sam_validateParams_6',
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
   * Set accepted margin value in airdrop contract
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