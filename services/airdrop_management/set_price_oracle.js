"use strict";

/**
 *
 * This class would be used for executing worker is_worker.<br><br>
 *
 * @module services/airdrop_management/set_price_oracle
 *
 */
const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , helper = require(rootPrefix + '/lib/contract_interact/helper')
  , AirdropContractInteractKlass = require(rootPrefix + '/lib/contract_interact/airdrop')
;

/**
 * Constructor to create object of register
 *
 * @constructor
 *
 * @param {string} airdropContractAddress - airdrop contract address
 * @param {string} chainId - chain id
 * @param {string} senderAddress - address of sender
 * @param {string} senderPassphrase - passphrase of sender
 * @param {string} currency - quote currency
 * @param {string} address - address of price oracle
 * @param {BigNumber} gasPrice - gas price
 * @param {object} options - for params like returnType, tag.
 *
 * @return {Object}
 *
 */
const SetPriceOracleKlass = function (params) {
  logger.debug("=======SetPriceOracleKlass.params=======");
  // Don't log passphrase
  logger.debug(params.airdrop_contract_address, params.chain_id, params.sender_address, params.currency,
    params.price_oracle_contract_address, params.gas_price, params.options);

  const oThis = this
  ;
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.chainId = params.chain_id;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.currency = params.currency;
  oThis.priceOracleContractAddress = params.price_oracle_contract_address;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;
};

SetPriceOracleKlass.prototype = {

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
      logger.debug("=======SetPriceOracleKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.setPriceOracle();
      logger.debug("=======SetPriceOracleKlass.setPriceOracle.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_w_spo_perform_1', 'Something went wrong. ' + err.message);
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
      return responseHelper.error('s_am_spo_validateParams_1', 'currency is mandatory');
    }

    if (!oThis.gasPrice) {
      return responseHelper.error('s_am_spo_validateParams_2', 'gas is mandatory');
    }

    if (!basicHelper.isAddressValid(oThis.priceOracleContractAddress)) {
      return responseHelper.error('s_am_spo_validateParams_3', 'priceOracleContractAddress is invalid');
    }

    if (!basicHelper.isAddressValid(oThis.senderAddress)) {
      return responseHelper.error('s_am_spo_validateParams_4', 'address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * set price oracle contract address in airdrop contract
   *
   * @return {promise<result>}
   *
   */
  setPriceOracle: function () {
    const oThis = this
    ;
    const AirdropContractInteractObject = new AirdropContractInteractKlass(
      oThis.airdropContractAddress,
      oThis.chainId
    );
    return AirdropContractInteractObject.setPriceOracle(
      oThis.senderAddress,
      oThis.senderPassphrase,
      oThis.currency,
      oThis.priceOracleContractAddress,
      oThis.gasPrice,
      oThis.options
    );
  }

};

module.exports = SetPriceOracleKlass;