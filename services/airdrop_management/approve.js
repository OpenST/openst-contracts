"use strict";

/**
 *
 * This is a utility file which would be used for executing approve by airdrop budget holder.<br><br>
 *
 * @module services/airdrop_management/approve
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
;

/**
 * Constructor to create object of approve
 *
 * @constructor
 *
 * @param {Hex} airdrop_contract_address - airdrop contract address
 * @param {String} airdrop_budget_holder_passphrase - airdropBudgetHolder Passphrase
 * @param {String} gas_price - gas price
 * @param {Number} chain_id - chain Id
 * @param {Object} options - chain Id
 *
 * @return {Object}
 *
 */
const ApproveKlass = function(params) {
  logger.debug("=========Approve.params=========");
  // Don't log passphrase
  logger.debug(params.airdrop_contract_address, params.gas_price, params.chain_id, params.options);
  const oThis = this;
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
   * @return {Promise}
   *
   */
  perform: async function () {

    const oThis = this;

    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("\n=========Approve.validateParams.result=========");
      logger.debug(r);
      if(r.isFailure()) return r;

      r = oThis.doApprove();
      logger.debug("\n=========Approve.doApprove.result=========");
      logger.debug(r);
      return r;
    } catch(err) {
      return responseHelper.error('s_am_a_perform_1', 'Something went wrong. ' + err.message)
    }

  },

  /**
   * Validate params
   *
   * @return {Promise}
   *
   */
  validateParams: function(){
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('s_am_a_validateParams_1', 'airdrop contract address is invalid'));
      }

      // Check if airdropContractAddress is registered or not
      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
       ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('s_am_a_validateParams_2', 'Given airdrop contract is not registered'));
      }

      var airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('s_am_a_validateParams_3', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.airdropBudgetHolderAddress)) {
        return onResolve(responseHelper.error('s_am_a_validateParams_4', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      oThis.brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      result = await oThis.brandedTokenObject.getBalanceOf(oThis.airdropBudgetHolderAddress);
      oThis.amount = result.data.balance;
      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('s_am_a_validateParams_5', 'amount is invalid value'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_a_validateParams_6', 'ChainId is invalid'));
      }

      if (!oThis.gasPrice) {
        return onResolve(responseHelper.error('s_am_a_validateParams_7', 'gas is mandatory'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Perform Approve to airdrop budget holder
   *
   * @return {Promise}
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

module.exports = ApproveKlass;