"use strict";

/**
 *
 * This class would be used for executing airdrop pay.<br><br>
 *
 * @module services/airdrop/pay
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropContractInteractKlass = require(rootPrefix + '/lib/contract_interact/airdrop')
;

/**
 * Constructor to create object of airdrop PayKlass
 *
 * @param {string} airdrop_contract_address - airdrop contract address
 * @param {string} chain_id - chain Id
 * @param {string} sender_worker_address - address of worker
 * @param {string} sender_worker_passphrase - passphrase of worker
 * @param {string} beneficiary_address - address of beneficiary account
 * @param {BigNumber} transfer_amount - transfer amount (in wei)
 * @param {string} commission_beneficiary_address - address of commision beneficiary account
 * @param {BigNumber} commission_amount - commission amount (in wei)
 * @param {string} currency - quote currency
 * @param {BigNumber} intended_price_point - price point at which the pay is intended (in wei)
 * @param {string} spender - User address
 * @param {Hex} gas_price - gas price
 * @param {object} options - for params like returnType, tag.
 *
 * @constructor
 *
 */
const PayKlass = function (params) {
  logger.debug("=======PayKlass.params=======");
  logger.debug(params.airdrop_contract_address, params.chain_id, params.sender_worker_address, params.beneficiary_address,
    params.transfer_amount, params.commission_beneficiary_address, params.commission_amount, params.currency, params.intended_price_point,
    params.spender, params.gas_price, params.options);

  const oThis = this
  ;

  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.chainId = params.chain_id;
  oThis.senderWorkerAddress = params.sender_worker_address;
  oThis.senderWorkerPassphrase = params.sender_worker_passphrase;
  oThis.beneficiaryAddress = params.beneficiary_address;
  oThis.transferAmount = params.transfer_amount;
  oThis.commissionBeneficiaryAddress = params.commission_beneficiary_address;
  oThis.commissionAmount = params.commission_amount;
  oThis.currency = params.currency;
  oThis.intendedPricePoint = params.intended_price_point;
  oThis.spender = params.spender;
  oThis.gasPrice = params.gas_price;
  oThis.options = params.options;
};

PayKlass.prototype = {

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
      logger.debug("=======PayKlass.validateParams.result=======");
      logger.debug(r);
      if (r.isFailure()) return r;

      r = await oThis.pay();
      logger.debug("=======PayKlass.pay.result=======");
      logger.debug(r);

      return r;

    } catch (err) {
      return responseHelper.error('s_a_p_perform_1', 'Something went wrong. ' + err.message);
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
    if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
      return responseHelper.error('s_a_p_validateParams_1', 'airdrop contract address is invalid');
    }

    return responseHelper.successWithData({});
  },

  /**
   * airdrop pay
   *
   * @return {promise<result>}
   *
   */
  pay: function () {
    const oThis = this
    ;
    const AirdropContractInteractObject = new AirdropContractInteractKlass(
      oThis.airdropContractAddress,
      oThis.chainId
    );
    return AirdropContractInteractObject.pay(
      oThis.senderWorkerAddress,
      oThis.senderWorkerPassphrase,
      oThis.beneficiaryAddress,
      oThis.transferAmount,
      oThis.commissionBeneficiaryAddress,
      oThis.commissionAmount,
      oThis.currency,
      oThis.intendedPricePoint,
      oThis.spender,
      oThis.gasPrice,
      oThis.options
    );
  }

};

module.exports = PayKlass;