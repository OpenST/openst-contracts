"use strict";

/**
 *
 * This is a utility file which would be used for executing transfer amount to airdrop budget holder.<br><br>
 *
 * @module services/airdrop_management/transfer
 *
 */

const rootPrefix = '../..'
  , responseHelper = require(rootPrefix + '/lib/formatter/response')
  , airdropAllocationProofDetailKlass = require(rootPrefix + '/app/models/airdrop_allocation_proof_detail')
  , airdropContractInteract = require(rootPrefix + '/lib/contract_interact/airdrop')
  , brandedTokenContractInteract = require(rootPrefix + '/lib/contract_interact/branded_token')
  , BigNumber = require('bignumber.js')
  , basicHelper = require(rootPrefix + '/helpers/basic_helper')
  , logger = require(rootPrefix + '/helpers/custom_console_logger')
  , AirdropModelCacheKlass = require(rootPrefix + '/lib/cache_management/airdrop_model')
  , BrandedTokenKlass = require(rootPrefix + '/lib/contract_interact/branded_token')
;

/**
 * Constructor to create object of transfer
 *
 * @constructor
 *
 * @param {Hex} sender_address - sender address
 * @param {String} sender_passphrase - sender Passphrase
 * @param {Hex} airdrop_contract_address - airdrop contract address
 * @param {String} amount - amount in wei
 * @param {String} gas_price - gas price
 * @param {Number} chain_id - chain Id
 * @param {Object} options - chain Id
 *
 * @return {Object}
 *
 */
const TransferKlass = function(params) {
  logger.debug("\n=========Transfer params=========");
  // Don't log passphrase
  logger.debug(params.sender_address, params.airdrop_contract_address, params.amount, params.gas_price, params.chain_id, params.options);
  const oThis = this;
  oThis.senderAddress = params.sender_address;
  oThis.senderPassphrase = params.sender_passphrase;
  oThis.airdropContractAddress = params.airdrop_contract_address;
  oThis.amount = params.amount;
  oThis.gasPrice = params.gas_price;
  oThis.chainId = params.chain_id;
  oThis.options = params.options;

  oThis.airdropBudgetHolder = null;
  oThis.brandedTokenContractAddress = null;

};

TransferKlass.prototype = {

  /**
   * Perform method
   *
   * @return {Promise}
   *
   */
  perform: async function () {

    const oThis = this;

    try {
      var r = null;

      r = await oThis.validateParams();
      logger.debug("\n=========Transfer.validateParams.result=========");
      logger.debug(r);
      if(r.isFailure()) return r;

      r = oThis.doTransfer();
      logger.debug("\n=========Transfer.doTransfer.result=========");
      logger.debug(r);
      return r;
    } catch(err) {
      return responseHelper.error('s_am_t_perform_1', 'Something went wrong. ' + err.message);
    }

  },

  /**
   * validation of params
   *
   * @return {Promise}
   *
   */
  validateParams: function() {
    const oThis = this;
    return new Promise(async function (onResolve, onReject) {

      if (!basicHelper.isAddressValid(oThis.senderAddress)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_1', 'sender address is invalid'));
      }

      if (!basicHelper.isAddressValid(oThis.airdropContractAddress)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_2', 'airdrop contract address is invalid'));
      }

      // Check if airdropContractAddress is registered or not

      const airdropModelCacheObject = new AirdropModelCacheKlass({useObject: true, contractAddress: oThis.airdropContractAddress})
        , airdropModelCacheResponse = await airdropModelCacheObject.fetch()
      ;
      oThis.airdropRecord = airdropModelCacheResponse.data[oThis.airdropContractAddress];
      if (!oThis.airdropRecord){
        return onResolve(responseHelper.error('s_am_t_validateParams_3', 'Given airdrop contract is not registered'));
      }

      const airdropContractInteractObject = new airdropContractInteract(oThis.airdropContractAddress, oThis.chainId);
      var result = await airdropContractInteractObject.brandedToken();
      oThis.brandedTokenContractAddress = result.data.brandedToken;
      logger.debug("\n==========transfer.validateParams.brandedToken===========");
      logger.debug("\nairdropContractInteractObject.brandedToken():", result,"\noThis.brandedTokenContractAddress:", oThis.brandedTokenContractAddress);
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_4', 'brandedTokenContractAddress set in airdrop contract is invalid'));
      }

      result = await airdropContractInteractObject.airdropBudgetHolder();
      oThis.airdropBudgetHolderAddress = result.data.airdropBudgetHolder;
      if (!basicHelper.isAddressValid(oThis.brandedTokenContractAddress)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_5', 'airdropBudgetHolderAddress set in airdrop contract is invalid'));
      }

      const amountInBigNumber = new BigNumber(oThis.amount);
      if (amountInBigNumber.isNaN() || !amountInBigNumber.isInteger()){
        return onResolve(responseHelper.error('s_am_t_validateParams_6', 'amount is invalid value'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_7', 'ChainId is invalid'));
      }

      const brandedTokenObject = new BrandedTokenKlass(oThis.brandedTokenContractAddress, oThis.chainId);
      const senderBalanceResponse = await brandedTokenObject.getBalanceOf(oThis.senderAddress);

      if (senderBalanceResponse.isFailure()) {
        return onResolve(responseHelper.error('s_am_t_validateParams_8', 'Error while getting sender balance'));
      }

      const senderBalance = new BigNumber(senderBalanceResponse.data.balance);
      //logger.debug("senderBalance: "+senderBalance.toString(10), "amount to transfer: "+amountInBigNumber);
      if (senderBalance.lt(amountInBigNumber)){
        return onResolve(responseHelper.error('s_am_t_validateParams_9', 'Sender balance: '+ senderBalance.toString(10) +' is not enough to transfer amount: '+amountInBigNumber.toString(10)));
      }

      if (!oThis.gasPrice) {
        return onResolve(responseHelper.error('s_am_t_validateParams_10', 'gas is mandatory'));
      }

      if (!basicHelper.isValidChainId(oThis.chainId)) {
        return onResolve(responseHelper.error('s_am_t_validateParams_11', 'ChainId is invalid'));
      }

      return onResolve(responseHelper.successWithData({}));

    });

  },

  /**
   * Transfer amount to airdrop budget holder
   *
   * @return {Promise}
   *
   */
  doTransfer: async function() {
    const oThis = this;

    return new Promise(async function (onResolve, onReject) {
      // BrandedToken transfer
      logger.debug("\n==========doTransfer.oThis.brandedTokenContractAddress===========");
      logger.debug(oThis.brandedTokenContractAddress);
      var brandedTokenObject = new brandedTokenContractInteract(oThis.brandedTokenContractAddress, oThis.chainId);
      const transactionResponse = await brandedTokenObject.transferToAirdropBudgetHolder(oThis.senderAddress,
        oThis.senderPassphrase,
        oThis.airdropBudgetHolderAddress,
        oThis.amount,
        oThis.gasPrice,
        oThis.options);
      if (transactionResponse.isSuccess()){
        var airdropAllocationProofDetailModel = new airdropAllocationProofDetailKlass();
        const airdropAllocationProofDetailCreateResult = await airdropAllocationProofDetailModel.createRecord(transactionResponse.data.transaction_hash, oThis.amount, 0);
        if (airdropAllocationProofDetailCreateResult.isFailure()) {
          return onResolve(airdropAllocationProofDetailCreateResult);
        }
      }
      return onResolve(transactionResponse);
    });
  }

};

module.exports = TransferKlass;

